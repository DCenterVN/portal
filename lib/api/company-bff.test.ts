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
  it("forwards the role catalog read and nothing else on that path", async () => {
    global.fetch = vi.fn().mockResolvedValue(new Response(JSON.stringify({ code: 200, status: "success", message: "OK", data: { items: [] } })));
    expect((await forwardCompany(request("company/roles"), ["company", "roles"])).status).toBe(200);
    expect(String((global.fetch as ReturnType<typeof vi.fn>).mock.calls[0][0])).toMatch(/\/org\/company\/roles$/);
    expect((await forwardCompany(request("company/roles", "PUT", "jwt", "{}"), ["company", "roles"])).status).toBe(404);
    expect((await forwardCompany(request("company/roles?org_id=bad"), ["company", "roles"])).status).toBe(400);
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


import { GET, POST, PUT, PATCH, DELETE } from "@/app/api/org/[...path]/route";
import { operations } from "./operations";
import { OPERATIONS as generatedOperations } from "@/lib/contracts/operations.generated";
import { companyBranches } from "./branches-client";
import { companyMemberships, createMembership, deleteMembership, replaceMembershipRoles, updateMembership, companyRoleMatrix, companyAudit, companyRoles } from "./platform-client";
const member = "01960000-0000-7000-8000-000000000002";
const routes = [
  [GET, "GET", "company/memberships?page=2&limit=20", undefined],
  [POST, "POST", "company/memberships", { branch_id: root, user_id: member, role_codes: ["SALES"] }],
  [PUT, "PUT", `company/memberships/${member}/roles`, { role_codes: ["WAREHOUSE"] }],
  [PATCH, "PATCH", `company/memberships/${member}`, { status: "SUSPENDED" }],
  [DELETE, "DELETE", `company/memberships/${member}`, undefined],
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
  it.each([201, 400, 409, 503])("passes POST %s through unchanged", async (status) => {
    const body = { branch_id: root, email: "staff@example.test", display_name: "Staff", role_codes: ["SALES"] };
    const payload = status === 201 ? { data: { id: member } } : { errors: { error_code: "CONFLICT" } };
    const upstream = vi.fn().mockResolvedValue(new Response(JSON.stringify(payload), { status }));
    global.fetch = upstream;
    const response = await forwardCompany(request("company/memberships", "POST", "jwt", JSON.stringify(body)), ["company", "memberships"]);
    expect(response.status).toBe(status);
    expect(JSON.parse(upstream.mock.calls[0][1].body)).toEqual(body);
    expect(await response.json()).toEqual(payload);
  });
  it.each([403, 409])("passes DELETE %s through unchanged", async (status) => {
    const payload = { errors: { error_code: "CONFLICT" } };
    global.fetch = vi.fn().mockResolvedValue(new Response(JSON.stringify(payload), { status }));
    const response = await DELETE(request(`company/memberships/${member}`, "DELETE", "jwt"), { params: Promise.resolve({ path: ["company", "memberships", member] }) });
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
  it("removes branch operations while keeping web and email auth", () => {
    expect(Object.keys(operations).filter((key) => key.startsWith("org.operator.branch"))).toEqual([]);
    expect(operations).not.toHaveProperty("auth.native.login");
    expect(Object.values(generatedOperations).some((operation) => operation.service === "auth" && operation.path.includes("/email/"))).toBe(true);
    expect(generatedOperations.webLogin.path).toBe("/auth/web/login");
    expect(Object.values(generatedOperations).some(operation => /native|org-context|account\/email/.test(operation.path))).toBe(false);
    expect(Object.values(generatedOperations).some((operation) => operation.path.includes("/internal/operator/branches") || operation.path.includes("/internal/branches/onboard"))).toBe(false);
  });
});

describe("company client contracts", () => {
  it("calls list/create/roles/status and matrix/audit without org_id", async () => {
    const row = { id: member, user_id: root, branch_id: root, role_codes: ["SALES"], status: "ACTIVE", display_name: "Staff", email: "staff@example.test", branch_name: "Bếp trung tâm", all_branches: false };
    const values = [{ items: [row], page: 1, limit: 20 }, row, { membership_id: member, role_codes: ["SALES"] }, { membership_id: member, status: "SUSPENDED" }, { membership_id: member }, { SALES: [] }, { items: [], page: 1, limit: 20 }];
    const fetchMock = vi.fn();
    for (const data of values) fetchMock.mockResolvedValueOnce(new Response(JSON.stringify({ code: 200, status: "success", message: "OK", data })));
    global.fetch = fetchMock;
    expect((await companyMemberships(1)).items).toEqual([row]);
    const input = { branch_id: root, user_id: member, role_codes: ["SALES"] };
    await createMembership(input);
    expect(JSON.parse(fetchMock.mock.calls[1][1].body)).toEqual(input);
    await replaceMembershipRoles(member, ["SALES"]);
    await updateMembership(member, { status: "SUSPENDED" });
    await deleteMembership(member);
    await companyRoleMatrix(root);
    await companyAudit(root);
    const calls = fetchMock.mock.calls.map(([url, init]) => [new URL(String(url)).pathname + new URL(String(url)).search, init?.method ?? "GET"]);
    expect(calls).toEqual([
      ["/api/org/company/memberships?page=1&limit=20", "GET"], ["/api/org/company/memberships", "POST"],
      [`/api/org/company/memberships/${member}/roles`, "PUT"], [`/api/org/company/memberships/${member}`, "PATCH"],
      [`/api/org/company/memberships/${member}`, "DELETE"],
      ["/api/org/company/role-matrix", "GET"], ["/api/org/company/audit-logs?page=1&limit=20", "GET"],
    ]);
  });
});

describe("role catalog client", () => {
  it("reads branch types and tolerates a role without any", async () => {
    global.fetch = vi.fn().mockResolvedValue(new Response(JSON.stringify({ code: 200, status: "success", message: "OK", data: { items: [{ code: "SALES", name: "Bán hàng", branch_types: ["CENTRAL_KITCHEN", "STORE"] }, { code: "NEW", name: "Mới", branch_types: null }] } })));
    expect(await companyRoles()).toEqual([{ code: "SALES", name: "Bán hàng", description: "", sort_order: 0, protected: false, branch_types: ["CENTRAL_KITCHEN", "STORE"] }, { code: "NEW", name: "Mới", description: "", sort_order: 0, protected: false, branch_types: [] }]);
    expect(new URL(String((global.fetch as ReturnType<typeof vi.fn>).mock.calls[0][0]), "http://localhost").pathname).toBe("/api/org/company/roles");
  });
});

describe("branch list client", () => {
  it("takes the company name from GET /org/company and keeps unknown branch types", async () => {
    const row = (name: string, type: string) => ({ id: root, code: "X", name, type, status: "ACTIVE", employee_count: 1 });
    const envelope = (data: unknown) => new Response(JSON.stringify({ code: 200, status: "success", message: "OK", data }));
    global.fetch = vi.fn().mockImplementation((url: string) => Promise.resolve(String(url).endsWith("/company")
      ? envelope({ id: root, name: "Sunny" })
      : envelope({ items: [row("Cửa hàng Cầu Giấy", "STORE"), row("Kho lạnh", "COLD_HUB")], page: 1, limit: 100 })));
    const branches = await companyBranches();
    expect(branches.map((branch) => branch.org)).toEqual(["Sunny", "Sunny"]);
    expect(branches.map((branch) => branch.type)).toEqual(["STORE", "COLD_HUB"]);
  });
  it("parses a membership with an unknown role code", async () => {
    const row = { id: member, user_id: root, branch_id: root, role_codes: ["NEW_ROLE"], status: "ACTIVE", display_name: "A", email: "a@x.test", branch_name: "B", all_branches: false };
    global.fetch = vi.fn().mockResolvedValue(new Response(JSON.stringify({ code: 200, status: "success", message: "OK", data: { items: [row], page: 1, limit: 20 } })));
    expect((await companyMemberships(1)).items[0].role_codes).toEqual(["NEW_ROLE"]);
  });
});
