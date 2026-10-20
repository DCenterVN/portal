import { afterEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { forwardCompany } from "./company-bff";

const originalFetch = global.fetch;
afterEach(() => { global.fetch = originalFetch; vi.restoreAllMocks(); });
const root = "01960000-0000-7000-8000-000000000001";
function request(path: string, method = "GET", token = "jwt", body?: string) {
  return new NextRequest(`http://localhost:3000/api/org/${path}`, {
    method, headers: { ...(token ? { cookie: `access_token=${token}` } : {}), ...(body === undefined ? {} : { "content-type": "application/json" }) },
    ...(body === undefined ? {} : { body }),
  });
}
describe("company BFF MAIN allow-list", () => {
  it("fails closed without cookie", async () => {
    global.fetch = vi.fn();
    expect((await forwardCompany(request("company/modules", "GET", ""), ["company", "modules"])).status).toBe(401);
    expect(global.fetch).not.toHaveBeenCalled();
  });
  it.each([["internal/authorization/check", "POST"], ["company/modules", "PUT"], ["permissions/me", "PUT"]])("rejects unsupported path or method %s %s", async (path, method) => {
    global.fetch = vi.fn();
    expect((await forwardCompany(request(path, method), path.split("/"))).status).toBe(404);
    expect(global.fetch).not.toHaveBeenCalled();
  });
  it("rejects obsolete company scope and query injection", async () => {
    global.fetch = vi.fn();
    expect((await forwardCompany(request("company/modules?org_id=bad"), ["company", "modules"])).status).toBe(400);
    expect((await forwardCompany(request(`company/modules?org_id=${root}&org_id=${root}`), ["company", "modules"])).status).toBe(400);
    expect((await forwardCompany(request(`company/modules?org_id=${root}&url=http://attacker`), ["company", "modules"])).status).toBe(400);
    expect(global.fetch).not.toHaveBeenCalled();
  });
  it.each([["company/modules", "page=1"], ["company/role-matrix", "action=x"]])("rejects %s with %s that only a sibling endpoint takes", async (path, extra) => {
    global.fetch = vi.fn();
    expect((await forwardCompany(request(`${path}?org_id=${root}&${extra}`), path.split("/"))).status).toBe(400);
    expect(global.fetch).not.toHaveBeenCalled();
  });
  it("requires both context IDs for permission lookup", async () => {
    global.fetch = vi.fn();
    expect((await forwardCompany(request(`permissions/me?org_id=${root}`), ["permissions", "me"])).status).toBe(400);
    expect((await forwardCompany(request(`permissions/me?org_id=${root}&branch_id=bad`), ["permissions", "me"])).status).toBe(400);
    expect(global.fetch).not.toHaveBeenCalled();
  });
  it("preserves org error status and body", async () => {
    global.fetch = vi.fn().mockResolvedValue(new Response(JSON.stringify({ code: 403, errors: { error_code: "forbidden" } }), { status: 403 }));
    const response = await forwardCompany(request("company/role-matrix"), ["company", "role-matrix"]);
    expect(response.status).toBe(403);
    expect((await response.json()).errors.error_code).toBe("forbidden");
  });
});


import { GET, POST, PUT, PATCH } from "@/app/api/org/[...path]/route";
import { operations } from "./operations";
import { OPERATIONS as generatedOperations } from "@/lib/contracts/operations.generated";
import { companyMemberships, createMembership, replaceMembershipRoles, updateMembershipStatus, companyRoleMatrix, companyAudit } from "./platform-client";
const member = "01960000-0000-7000-8000-000000000002";
const routes = [
  [GET, "GET", "company/memberships?page=2&limit=20", undefined],
  [POST, "POST", "company/memberships", { email: "staff@example.test", display_name: "Staff", role_codes: ["SALES"] }],
  [PUT, "PUT", `company/memberships/${member}/roles`, { role_codes: ["WAREHOUSE"] }],
  [PATCH, "PATCH", `company/memberships/${member}`, { status: "SUSPENDED" }],
] as const;
describe("membership routes", () => {
  it.each(routes)("forwards %s with the caller token and exact body", async (handler, method, path, body) => {
    global.fetch = vi.fn().mockResolvedValue(new Response(JSON.stringify({ data: {} }), { status: 200 }));
    const response = await handler(request(path, method, "caller", body && JSON.stringify(body)), { params: Promise.resolve({ path: path.split("?")[0].split("/") }) });
    expect(response.status).toBe(200);
    expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining(`/org/${path}`), expect.objectContaining({ method, headers: expect.objectContaining({ Authorization: "Bearer caller" }), ...(body ? { body: JSON.stringify(body) } : {}) }));
  });
  it.each(routes)("denies %s without a session", async (handler, method, path, body) => {
    global.fetch = vi.fn();
    const response = await handler(request(path, method, "", body && JSON.stringify(body)), { params: Promise.resolve({ path: path.split("?")[0].split("/") }) });
    expect(response.status).toBe(401);
    expect(global.fetch).not.toHaveBeenCalled();
  });
  it.each([403, 409, 503])("preserves upstream PATCH failure %s", async (status) => {
    const payload = { errors: { error_code: status === 409 ? "CONFLICT" : "FORBIDDEN" } };
    global.fetch = vi.fn().mockResolvedValue(new Response(JSON.stringify(payload), { status }));
    const response = await PATCH(request(`company/memberships/${member}`, "PATCH", "jwt", '{"status":"SUSPENDED"}'), { params: Promise.resolve({ path: ["company", "memberships", member] }) });
    expect(response.status).toBe(status);
    expect(await response.json()).toEqual(payload);
  });
  it("rejects customer paths, unknown queries and malformed JSON", async () => {
    global.fetch = vi.fn();
    expect((await forwardCompany(request("company/customers"), ["company", "customers"])).status).toBe(404);
    expect((await forwardCompany(request("company/memberships?org_id=" + root), ["company", "memberships"])).status).toBe(400);
    expect((await PATCH(request(`company/memberships/${member}`, "PATCH", "jwt", "bad"), { params: Promise.resolve({ path: ["company", "memberships", member] }) })).status).toBe(400);
    expect(global.fetch).not.toHaveBeenCalled();
  });
  it("removes branch operations while keeping native and email auth", () => {
    expect(Object.keys(operations).filter((key) => key.startsWith("org.operator.branch"))).toEqual([]);
    expect(operations).toHaveProperty("auth.native.login");
    expect(Object.values(generatedOperations).some((operation) => operation.service === "auth" && operation.path.includes("/email/"))).toBe(true);
    expect(generatedOperations.nativeLogin.path).toBe("/auth/native/login");
    expect(Object.values(generatedOperations).some((operation) => operation.path.includes("/internal/operator/branches") || operation.path.includes("/internal/branches/onboard"))).toBe(false);
  });
});

describe("company client contracts", () => {
  it("calls list/create/roles/status and matrix/audit without org_id", async () => {
    const row = { id: member, user_id: root, branch_id: root, role_codes: ["SALES"], status: "ACTIVE" };
    const values = [{ items: [row], page: 1, limit: 20 }, row, { membership_id: member, role_codes: ["SALES"] }, { membership_id: member, status: "SUSPENDED" }, { SALES: [] }, { items: [], page: 1, limit: 20 }];
    const fetchMock = vi.fn();
    for (const data of values) fetchMock.mockResolvedValueOnce(new Response(JSON.stringify({ code: 200, status: "success", message: "OK", data })));
    global.fetch = fetchMock;
    expect((await companyMemberships(1)).items).toEqual([row]);
    await createMembership({ email: "staff@example.test", display_name: "Staff", role_codes: ["SALES"] });
    await replaceMembershipRoles(member, ["SALES"]);
    await updateMembershipStatus(member, "SUSPENDED");
    await companyRoleMatrix(root);
    await companyAudit(root);
    const calls = fetchMock.mock.calls.map(([url, init]) => [new URL(String(url)).pathname + new URL(String(url)).search, init?.method ?? "GET"]);
    expect(calls).toEqual([
      ["/api/org/company/memberships?page=1&limit=20", "GET"], ["/api/org/company/memberships", "POST"],
      [`/api/org/company/memberships/${member}/roles`, "PUT"], [`/api/org/company/memberships/${member}`, "PATCH"],
      ["/api/org/company/role-matrix", "GET"], ["/api/org/company/audit-logs?page=1&limit=20", "GET"],
    ]);
  });
});
