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
    expect((await forwardCompany(request(`company/modules?org_id=${root}`, "GET", ""), ["company", "modules"])).status).toBe(401);
    expect(global.fetch).not.toHaveBeenCalled();
  });
  it.each([["internal/authorization/check", "POST"], ["company/modules", "PUT"], ["support-access/x/approve", "POST"], ["permissions/me", "PUT"]])("rejects unsupported path or method %s %s", async (path, method) => {
    global.fetch = vi.fn();
    expect((await forwardCompany(request(path, method), path.split("/"))).status).toBe(404);
    expect(global.fetch).not.toHaveBeenCalled();
  });
  it("requires UUID MAIN scope and rejects query injection", async () => {
    global.fetch = vi.fn();
    expect((await forwardCompany(request("company/modules?org_id=bad"), ["company", "modules"])).status).toBe(400);
    expect((await forwardCompany(request(`company/modules?org_id=${root}&org_id=${root}`), ["company", "modules"])).status).toBe(400);
    expect((await forwardCompany(request(`company/modules?org_id=${root}&url=http://attacker`), ["company", "modules"])).status).toBe(400);
    expect(global.fetch).not.toHaveBeenCalled();
  });
  it.each([["company/modules", "page=1"], ["company/role-matrix", "action=x"], ["company/support-access", "since=2026-01-01T00:00:00Z"]])("rejects %s with %s that only a sibling endpoint takes", async (path, extra) => {
    global.fetch = vi.fn();
    expect((await forwardCompany(request(`${path}?org_id=${root}&${extra}`), path.split("/"))).status).toBe(400);
    expect(global.fetch).not.toHaveBeenCalled();
  });
  it("requires both MAIN IDs for permission lookup", async () => {
    global.fetch = vi.fn();
    expect((await forwardCompany(request(`permissions/me?org_id=${root}`), ["permissions", "me"])).status).toBe(400);
    expect((await forwardCompany(request(`permissions/me?org_id=${root}&branch_id=bad`), ["permissions", "me"])).status).toBe(400);
    expect(global.fetch).not.toHaveBeenCalled();
  });
  it("forwards org_id on OWNER decisions with no fabricated body", async () => {
    global.fetch = vi.fn().mockResolvedValue(new Response("{}", { status: 200 }));
    const grant = "01960000-0000-7000-8000-000000000002";
    const response = await forwardCompany(request(`support-access/${grant}/approve?org_id=${root}`, "POST"), ["support-access", grant, "approve"]);
    expect(response.status).toBe(200);
    expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining(`/org/support-access/${grant}/approve?org_id=${root}`), expect.not.objectContaining({ body: expect.anything() }));
  });
  it("preserves org error status and body", async () => {
    global.fetch = vi.fn().mockResolvedValue(new Response(JSON.stringify({ code: 403, errors: { error_code: "forbidden" } }), { status: 403 }));
    const response = await forwardCompany(request(`company/role-matrix?org_id=${root}`), ["company", "role-matrix"]);
    expect(response.status).toBe(403);
    expect((await response.json()).errors.error_code).toBe("forbidden");
  });
});
