import { afterEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { forwardPlatform } from "./platform-bff";

const originalFetch = global.fetch;
afterEach(() => { global.fetch = originalFetch; vi.restoreAllMocks(); });
function request(path: string, method = "GET", token = "jwt", body?: string) {
  return new NextRequest(`http://localhost:3000/api/platform/${path}`, {
    method, headers: { ...(token ? { cookie: `access_token=${token}` } : {}), ...(body === undefined ? {} : { "content-type": "application/json" }) },
    ...(body === undefined ? {} : { body }),
  });
}

describe("platform BFF allow-list", () => {
  it("rejects missing credentials without contacting org", async () => {
    global.fetch = vi.fn();
    expect((await forwardPlatform(request("me", "GET", ""), ["me"])).status).toBe(401);
    expect(global.fetch).not.toHaveBeenCalled();
  });
  it.each([["internal/users", "GET"], ["companies/a/modules", "GET"], ["companies/../../admin", "GET"], ["staff", "DELETE"], ["support-access/break-glass", "GET"]])("rejects unregistered %s %s", async (path, method) => {
    global.fetch = vi.fn();
    expect((await forwardPlatform(request(path, method), path.split("/"))).status).toBe(404);
    expect(global.fetch).not.toHaveBeenCalled();
  });
  it("rejects unknown and duplicate query fields", async () => {
    global.fetch = vi.fn();
    expect((await forwardPlatform(request("companies?debug=1"), ["companies"])).status).toBe(400);
    expect((await forwardPlatform(request("companies?page=1&page=2"), ["companies"])).status).toBe(400);
    expect(global.fetch).not.toHaveBeenCalled();
  });
  it("keeps pagination and bearer token on the server allow-list", async () => {
    global.fetch = vi.fn().mockResolvedValue(new Response("{}", { status: 200 }));
    const response = await forwardPlatform(request("companies?page=2&limit=20"), ["companies"]);
    expect(response.status).toBe(200);
    expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining("/platform/companies?page=2&limit=20"), expect.objectContaining({ headers: expect.objectContaining({ Authorization: "Bearer jwt" }), cache: "no-store" }));
  });
  it("forwards onboard JSON and idempotency key unchanged", async () => {
    global.fetch = vi.fn().mockResolvedValue(new Response("{}", { status: 201 }));
    const req = request("companies", "POST", "jwt", JSON.stringify({ name: "A", contract_ref: "C" }));
    req.headers.set("Idempotency-Key", "onboard-1");
    expect((await forwardPlatform(req, ["companies"])).status).toBe(201);
    expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining("/platform/companies"), expect.objectContaining({ headers: expect.objectContaining({ "Idempotency-Key": "onboard-1" }), body: JSON.stringify({ name: "A", contract_ref: "C" }) }));
  });
  it("preserves upstream 409 and rejects invalid JSON without forwarding", async () => {
    global.fetch = vi.fn().mockResolvedValue(new Response(JSON.stringify({ code: 409, errors: { error_code: "conflict" } }), { status: 409 }));
    const response = await forwardPlatform(request("support-access/break-glass", "POST", "jwt", "{}"), ["support-access", "break-glass"]);
    expect(response.status).toBe(409);
    global.fetch = vi.fn();
    expect((await forwardPlatform(request("companies", "POST", "jwt", "{"), ["companies"])).status).toBe(400);
    expect(global.fetch).not.toHaveBeenCalled();
  });
});
