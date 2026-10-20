import {afterEach, describe, expect, it, vi} from "vitest";
import {NextRequest} from "next/server";
vi.mock("server-only", () => ({}));
vi.mock("@/lib/auth/operator", () => ({requireOperator: vi.fn(async () => ({login: "operator"}))}));
vi.mock("@/lib/audit/store", () => ({appendAudit: vi.fn()}));
import {POST} from "../../app/api/operations/[operationId]/route";
import {operations} from "./operations";
afterEach(() => {vi.unstubAllEnvs(); vi.unstubAllGlobals(); vi.restoreAllMocks();});
function request(ip: string | null = "::ffff:192.0.2.1", extra: Record<string, unknown> = {}) {
  const headers = new Headers({"Content-Type": "application/json", "X-Forwarded-For": "198.51.100.99", Forwarded: "for=198.51.100.99"});
  if (ip !== null) headers.set("X-Real-IP", ip);
  return new NextRequest("http://localhost/api/operations/auth.native.login", {method: "POST", headers, body: JSON.stringify({reason: "testing IP forwarding", payload: {identifier: "a", password: "secret"}, ...extra})});
}
const run = (req: NextRequest, operationId = "auth.native.login") => POST(req, {params: Promise.resolve({operationId})});
const reply = (status = 200, retry?: string) => new Response(JSON.stringify(status === 200 ? {result: "ok"} : {error: "rate_limit_exceeded"}), {status, headers: {"Content-Type": "application/json", ...(retry ? {"Retry-After": retry} : {})}});
describe("S6 operator auth client IP", () => {
  it.each(["auth.native.login", "auth.operator.users.list", "auth.operator.user.security-action"])("%s forwards exactly the sanitized IP", async operationId => {
    vi.stubEnv("PORTAL_CLIENT_IP_SOURCE", "trusted-kong");
    const fetch = vi.fn().mockResolvedValue(reply()); vi.stubGlobal("fetch", fetch);
    expect((await run(request(undefined, {params: {user_id: "u"}, clientIP: "198.51.100.99"}), operationId)).status).toBe(200);
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(Object.fromEntries(new Headers(fetch.mock.calls[0][1].headers))).toEqual({"content-type": "application/json", "user-agent": "portal-bff/operator-console", "x-forwarded-for": "192.0.2.1"});
  });
  it("compresses and lowercases IPv6 through the real route", async () => {
    vi.stubEnv("PORTAL_CLIENT_IP_SOURCE", "trusted-kong");
    const fetch = vi.fn().mockResolvedValue(reply()); vi.stubGlobal("fetch", fetch);
    expect((await run(request("2001:0DB8:0000:0000:0000:0000:0000:0001"))).status).toBe(200);
    expect(new Headers(fetch.mock.calls[0][1].headers).get("x-forwarded-for")).toBe("2001:db8::1");
  });
  it.each([null, "", "192.0.2.1, 192.0.2.1", "[::1]", "192.0.2.1:80", "fe80::1%eth0"])("invalid trusted IP %s is 503 before fetch", async ip => {
    vi.stubEnv("PORTAL_CLIENT_IP_SOURCE", "trusted-kong");
    const fetch = vi.fn(); vi.stubGlobal("fetch", fetch);
    const res = await run(request(ip)); expect(res.status).toBe(503);
    expect(JSON.stringify(await res.json())).toContain("INTERNAL_ERROR"); expect(fetch).not.toHaveBeenCalled();
  });
  it("rejects duplicate identical X-Real-IP values", async () => {
    vi.stubEnv("PORTAL_CLIENT_IP_SOURCE", "trusted-kong");
    const req = request("192.0.2.1"); req.headers.append("X-Real-IP", "192.0.2.1");
    const fetch = vi.fn(); vi.stubGlobal("fetch", fetch);
    expect((await run(req)).status).toBe(503); expect(fetch).not.toHaveBeenCalled();
  });
  it("unknown mode fails closed before auth fetch", async () => {
    vi.stubEnv("PORTAL_CLIENT_IP_SOURCE", "invalid"); const fetch = vi.fn(); vi.stubGlobal("fetch", fetch);
    expect((await run(request())).status).toBe(503); expect(fetch).not.toHaveBeenCalled();
  });
  it("unset mode warns once across operator requests and adds no forwarding", async () => {
    vi.stubEnv("PORTAL_CLIENT_IP_SOURCE", undefined); vi.resetModules();
    const {POST: fresh} = await import("../../app/api/operations/[operationId]/route");
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const fetch = vi.fn().mockImplementation(async () => reply()); vi.stubGlobal("fetch", fetch);
    for (let n = 0; n < 2; n++) expect((await fresh(request(), {params: Promise.resolve({operationId: "auth.native.login"})})).status).toBe(200);
    expect(warn).toHaveBeenCalledTimes(1);
    for (const call of fetch.mock.calls) expect(Object.fromEntries(new Headers(call[1].headers))).toEqual({"content-type": "application/json", "user-agent": "portal-bff/operator-console"});
  });
  it("429 carries Retry-After through BackendError into the operator response", async () => {
    vi.stubEnv("PORTAL_CLIENT_IP_SOURCE", "trusted-kong");
    const fetch = vi.fn().mockResolvedValue(reply(429, "900")); vi.stubGlobal("fetch", fetch);
    const res = await run(request()); expect(res.status).toBe(429); expect(res.headers.get("retry-after")).toBe("900");
    expect(await res.json()).toMatchObject({ok: false, data: {details: {error: "rate_limit_exceeded"}}});
    expect(new Headers(fetch.mock.calls[0][1].headers).get("x-forwarded-for")).toBe("192.0.2.1");
  });
  it.each(["integration.locations.vn.provinces"])("%s remains unchanged even with invalid ingress configuration", async operationId => {
    vi.stubEnv("PORTAL_CLIENT_IP_SOURCE", "invalid");
    const fetch = vi.fn().mockResolvedValue(reply()); vi.stubGlobal("fetch", fetch);
    expect((await run(request(null), operationId)).status).toBe(200);
    expect(Object.fromEntries(new Headers(fetch.mock.calls[0][1].headers))).toEqual({"content-type": "application/json", "user-agent": "portal-bff/operator-console"});
  });
  it("non-auth execute ignores the server IP in its context", async () => {
    const fetch = vi.fn().mockResolvedValue(reply()); vi.stubGlobal("fetch", fetch);
    await operations["integration.locations.vn.provinces"].execute({clientIP: "192.0.2.1"});
    expect(Object.fromEntries(new Headers(fetch.mock.calls[0][1].headers))).toEqual({"content-type": "application/json", "user-agent": "portal-bff/operator-console"});
  });
});
