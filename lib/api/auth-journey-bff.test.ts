import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest, NextResponse } from "next/server";
vi.mock("server-only", () => ({}));
import { POST as customer } from "../../app/api/auth/login/route";
import { POST as staff } from "../../app/api/auth/staff/login/route";
import { customerOperation, acceptStaffInvite, switchStaffContext, safeLanding } from "./auth-journey-bff";
const reply = (data: unknown, status = 200, cookies: string[] = []) => { const headers = new Headers({"content-type": "application/json"}); cookies.forEach(c => headers.append("set-cookie", c)); return new Response(JSON.stringify(data), {status, headers}); };
const request = (body: unknown = {identifier: "a@example.com", password: "password-1234"}) => new NextRequest("http://localhost/api/auth/login", { method: "POST", headers: {"Content-Type":"application/json","Sec-Fetch-Site":"same-origin",cookie: "access_token=existing; refresh_token=existing"}, body: JSON.stringify(body) });
const row = (org_id = "org-1", branch_id = "branch-1", member_type = "EMPLOYEE", status = "ACTIVE") => ({org_id, branch_id, member_type, status, roles: ["SALES"]});
const login = () => reply({access_token: "temporary", expires_in: 900, user: {id: "u", status: "ACTIVE"}}, 200, ["refresh_token=temporary-rt; Path=/; HttpOnly; Secure; SameSite=Strict", "CSRF-Token=temporary-csrf; Path=/; Secure"]);
function upstream(contexts: unknown = [row()], contextStatus = 200, switchStatus = 200, userStatus = "ACTIVE") {
  const fn = vi.fn(async (url: string) => {
    if (url.endsWith("/auth/web/login")) return login();
    if (url.endsWith("/platform/me")) return reply({error: "NOT_FOUND"}, 404);
    if (url.endsWith("/auth/me")) return reply({id: "u", status: userStatus});
    if (url.endsWith("/org/access-contexts/me")) return reply(contexts, contextStatus);
    if (url.endsWith("/auth/org-context")) return reply(switchStatus === 200 ? {access_token: "selected", expires_in: 900} : {error: "FORBIDDEN"}, switchStatus);
    if (url.endsWith("/auth/web/logout")) return reply({});
    throw Error("Unexpected upstream " + url);
  }); vi.stubGlobal("fetch", fn); return fn;
}
beforeEach(() => vi.restoreAllMocks());
describe("S2 login policy", () => {
  it("customer ACTIVE lands only in store without consulting org, including employee identity", async () => {
    const fetch = upstream(); const res = await customer(request()); expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({next_path: "/", user: {status: "ACTIVE"}});
    expect(fetch.mock.calls.some(([url]) => url.includes("/org/"))).toBe(false);
    expect(res.headers.get("cache-control")).toBe("no-store");
    expect(res.headers.get("set-cookie")).toContain("access_token=temporary"); expect(res.headers.get("set-cookie")).toMatch(/HttpOnly/i); expect(res.headers.get("set-cookie")).toMatch(/Secure/i);
  });
  it.each([[], [row("o", "b", "CUSTOMER")], [row("o", "b", "PLATFORM")], [row("o", "b", "EMPLOYEE", "SUSPENDED")]].map(contexts => [contexts]))("staff requires EMPLOYEE ACTIVE, revokes temporary session with its cookie/CSRF and emits no new cookie (%j)", async contexts => {
    const fetch = upstream(contexts); const res = await staff(request()); expect(res.status).toBe(403);
    expect(await res.json()).toMatchObject({error: "FORBIDDEN", message: expect.stringContaining("/login")});
    expect(res.headers.get("set-cookie")).toBeNull();
    expect(fetch).toHaveBeenCalledWith(expect.stringContaining("/auth/web/logout"), expect.objectContaining({headers: expect.objectContaining({Cookie: "refresh_token=temporary-rt; CSRF-Token=temporary-csrf", "X-CSRF-Token": "temporary-csrf", Authorization: "Bearer temporary"})}));
  });
  it("inactive auth profile fails closed and revokes", async () => { const fetch = upstream([], 200, 200, "SUSPENDED"); const res = await customer(request()); expect(res.status).toBe(403); expect(res.headers.get("set-cookie")).toBeNull(); expect(fetch.mock.calls.at(-1)?.[0]).toContain("logout"); });
  it.each([{account_type: "EMPLOYEE"}, {roles: ["OWNER"]}, {redirect: "/console"}])("rejects forged fields before creating session %j", async fields => { const fetch = upstream(); const res = await staff(request({identifier: "a", password: "p", ...fields})); expect(res.status).toBe(400); expect(await res.json()).toMatchObject({error: "BAD_REQUEST"}); expect(fetch).not.toHaveBeenCalled(); });
  it.each([null, [], {identifier: [], password: "p"}, {identifier: "a"}, {identifier: "", password: "p"}])("rejects malformed login %j", async body => { const fetch = upstream(); expect((await customer(request(body))).status).toBe(400); expect(fetch).not.toHaveBeenCalled(); });
  it("malformed JSON is BAD_REQUEST", async () => { const fetch = upstream(); const res = await staff(new NextRequest("http://localhost", {method: "POST", headers: {"Content-Type":"application/json", "Sec-Fetch-Site":"same-origin"}, body: "{"})); expect(res.status).toBe(400); expect(fetch).not.toHaveBeenCalled(); });
  it.each([null, {}, [{org_id: "o", branch_id: "b", member_type: "EMPLOYEE", roles: "OWNER"}], [row(), {garbage: true}]])("malformed org schema fails closed %j", async contexts => { upstream(contexts); const res = await staff(request()); expect(res.status).toBe(503); expect(res.headers.get("set-cookie")).toBeNull(); });
  it("org unavailable preserves upstream status/code/Retry-After and revokes", async () => {
    const fn = upstream([], 503); fn.mockImplementationOnce(async () => login()).mockImplementationOnce(async () => reply({id: "u", status: "ACTIVE"})).mockImplementationOnce(async () => reply({error: "NOT_FOUND"}, 404)).mockImplementationOnce(async () => new Response(JSON.stringify({error: "INTERNAL_ERROR"}), {status: 503, headers: {"Retry-After": "4"}}));
    const res = await staff(request()); expect(res.status).toBe(503); expect(res.headers.get("retry-after")).toBe("4"); expect(await res.json()).toMatchObject({error: "INTERNAL_ERROR"}); expect(res.headers.get("set-cookie")).toBeNull(); expect(fn.mock.calls.at(-1)?.[0]).toContain("logout");
  });
  it.each([[ [row("o1", "b1"), row("o2", "b2")], "/staff/switch-org" ], [[row("o", "b1"), row("o", "b2")], "/staff/switch-branch"]])("verified multi-context selection %j", async (contexts, landing) => { const fetch = upstream(contexts); const res = await staff(request()); expect(res.status).toBe(200); expect(await res.json()).toMatchObject({next_path: landing}); expect(fetch.mock.calls.some(([url]) => url.includes("switch"))).toBe(false); });
  it("dedupes role rows and switches the sole verified org/branch before publishing session", async () => { const fetch = upstream([row(), {...row(), roles: ["QC"]}]); const res = await staff(request()); expect(await res.json()).toMatchObject({next_path: "/console"}); expect(res.headers.get("set-cookie")).toContain("access_token=selected"); expect(fetch).toHaveBeenCalledWith(expect.stringContaining("/auth/org-context"), expect.objectContaining({body: JSON.stringify({org_id: "org-1", branch_id: "branch-1"})})); });
  it("switch failure never publishes cookie or console landing", async () => { const fetch = upstream([row()], 200, 403); const res = await staff(request()); expect(res.status).toBe(403); expect(res.headers.get("set-cookie")).toBeNull(); expect(await res.json()).not.toHaveProperty("next_path"); expect(fetch.mock.calls.at(-1)?.[0]).toContain("logout"); });
  it("transport failure is canonical INTERNAL_ERROR and does not expose exception", async () => { vi.stubGlobal("fetch", vi.fn().mockRejectedValue(Error("secret"))); const res = await staff(request()); expect(res.status).toBe(503); expect(await res.json()).toEqual({error: "INTERNAL_ERROR", message: "Dịch vụ xác thực hiện không khả dụng"}); });
  it.each(["https://evil.test", "//evil.test", "/\\evil.test", "/%5cevil.test", "/%2f%2fevil.test", "/%63onsole", "/store/../console", "/staff/../console", "/platform", "/console", "/staff/login"])("rejects cross-plane/encoded/external store landing %s", target => { expect(safeLanding(target, "customer")).toBe("/"); });
  it("accepts store-only and fixed staff destinations", () => { expect(safeLanding("/products?q=food", "customer")).toBe("/products?q=food"); expect(safeLanding("/staff/switch-org", "employee")).toBe("/staff/switch-org"); expect(safeLanding("/", "employee")).toBe("/staff/switch-branch"); });
});

describe("S2 rejected-session redaction", () => {
  it("upstream login errors preserve code/status/retry without exposing credentials or cookies", async () => {
    const headers = new Headers({"Retry-After": "3", "Set-Cookie": "refresh_token=reject"});
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({error: "UNAUTHORIZED", access_token: "secret", refresh_token: "secret"}), {status: 401, headers})));
    const res = await customer(request()); expect(res.status).toBe(401); expect(await res.json()).toEqual({error: "UNAUTHORIZED"}); expect(res.headers.get("retry-after")).toBe("3"); expect(res.headers.get("set-cookie")).toBeNull();
  });
  it("malformed success with temporary refresh cookie is rejected and revoked even without a valid access token", async () => {
    const fetch = vi.fn().mockResolvedValueOnce(reply({user: {status: "ACTIVE"}}, 200, ["refresh_token=malformed; Path=/", "CSRF-Token=csrf; Path=/"])).mockResolvedValue(reply({})); vi.stubGlobal("fetch", fetch);
    const res = await staff(request()); expect(res.status).toBe(503); expect(res.headers.get("set-cookie")).toBeNull(); expect(fetch).toHaveBeenCalledWith(expect.stringContaining("/auth/web/logout"), expect.objectContaining({headers: expect.objectContaining({Cookie: "refresh_token=malformed; CSRF-Token=csrf", "X-CSRF-Token": "csrf"})}));
  });
  it("org contract ACTIVE endpoint does not require a client-supplied status field", async () => {const context: Omit<ReturnType<typeof row>, "status"> & {status?: string} = row(); delete context.status; upstream([context]); const res = await staff(request()); expect(res.status).toBe(200); expect(await res.json()).toMatchObject({next_path: "/console"}); });
});

describe("R4-1 login employee marker", () => {
  const oldMarkerRequest = () => {
    const req = request();
    req.cookies.set("portal_plane", "employee");
    return req;
  };
  it.each([
    "__Host-refresh_token=rt; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=86400",
    "refresh_token=rt; Path=/; HttpOnly; SameSite=Strict; Max-Age=7200",
    "refresh_token=rt; Path=/; HttpOnly; SameSite=Lax; Max-Age=7200",
    "__Host-refresh_token=rt; Path=/; HttpOnly; Secure; SameSite=None; Max-Age=86400",
  ])("staff console login sets employee marker mirroring refresh flags and lifetime: %s", async refresh => {
    const fetch = upstream();
    fetch.mockImplementationOnce(async () => reply({access_token: "temporary", expires_in: 900}, 200, [refresh]));
    const res = await staff(oldMarkerRequest());
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({next_path: "/console"});
    const refreshCookie = new NextResponse(null, {headers: res.headers}).cookies.get(refresh.split("=", 1)[0])!;
    expect(res.cookies.get("portal_plane")).toMatchObject({value: "employee", httpOnly: refreshCookie.httpOnly, path: refreshCookie.path, sameSite: refreshCookie.sameSite, secure: refreshCookie.secure ?? false, maxAge: refreshCookie.maxAge});
  });
  it("customer login clears an old employee marker", async () => {
    upstream();
    const res = await customer(oldMarkerRequest());
    expect(res.status).toBe(200);
    expect(res.cookies.get("portal_plane")).toMatchObject({value: "", maxAge: 0, httpOnly: true, path: "/", sameSite: "strict"});
    expect(res.headers.getSetCookie().some(cookie => cookie.startsWith("portal_plane=employee"))).toBe(false);
  });
  it.each([
    [row("o1", "b1"), row("o2", "b2")],
    [row("o", "b1"), row("o", "b2")],
  ])("staff login awaiting context selection clears an old marker (%j)", async (...rows) => {
    upstream(rows);
    const res = await staff(oldMarkerRequest());
    expect(res.status).toBe(200);
    expect(res.cookies.get("portal_plane")).toMatchObject({value: "", maxAge: 0});
    expect((await res.json()).next_path).toMatch(/^\/staff\/switch-/);
  });
  it.each([customer, staff])("failed login clears an old marker without publishing a session", async handler => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(reply({error: "UNAUTHORIZED"}, 401)));
    const res = await handler(oldMarkerRequest());
    expect(res.status).toBe(401);
    expect(res.cookies.get("portal_plane")).toMatchObject({value: "", maxAge: 0, secure: false});
    expect(res.headers.getSetCookie()).toHaveLength(1);
  });
});

afterEach(() => vi.unstubAllEnvs());
describe("S5 auth client IP forwarding", () => {
  function edge(body?: unknown, ip = "::FFFF:C000:0201") {
    const req = request(body);
    req.headers.set("X-Real-IP", ip);
    req.headers.set("X-Forwarded-For", "198.51.100.99, 198.51.100.100");
    req.headers.set("Forwarded", "for=198.51.100.99");
    req.headers.set("User-Agent", "test-agent");
    return req;
  }
  function exact(headers: HeadersInit | undefined, allowed: Record<string, string>) {
    expect(Object.fromEntries(new Headers(headers))).toEqual({...allowed, "x-forwarded-for": "192.0.2.1"});
  }
  it.each([customer, staff])("login/profile/context use exact headers", async handler => {
    vi.stubEnv("PORTAL_CLIENT_IP_SOURCE", "trusted-kong");
    const calls: [string, RequestInit | undefined][] = [];
    const original = upstream();
    vi.stubGlobal("fetch", vi.fn(async (url: string, init?: RequestInit) => {calls.push([url, init]); return original(url);}));
    expect((await handler(edge())).status).toBe(200);
    for (const [url, init] of calls) {
      if (url.endsWith("/auth/web/login")) exact(init?.headers, {"content-type": "application/json", "user-agent": "test-agent"});
      else if (url.endsWith("/auth/org-context")) exact(init?.headers, {"content-type": "application/json", authorization: "Bearer temporary"});
      else if (url.endsWith("/auth/me")) exact(init?.headers, {authorization: "Bearer temporary"});
      else expect(Object.fromEntries(new Headers(init?.headers))).toEqual({authorization: "Bearer temporary"});
    }
  });
  it("rejection revokes with the same sanitized IP", async () => {
    vi.stubEnv("PORTAL_CLIENT_IP_SOURCE", "trusted-kong");
    const original = upstream([]); const calls: [string, RequestInit | undefined][] = [];
    vi.stubGlobal("fetch", vi.fn(async (url: string, init?: RequestInit) => {calls.push([url, init]); return original(url);}));
    expect((await staff(edge())).status).toBe(403);
    exact(calls.at(-1)?.[1]?.headers, {cookie: "refresh_token=temporary-rt; CSRF-Token=temporary-csrf", "x-csrf-token": "temporary-csrf", authorization: "Bearer temporary", "user-agent": "test-agent"});
  });
  const ops = [
    ["register", {email: "a@example.com", password: "password-1234"}],
    ["activate", {token: "token"}], ["resend", {email: "a@example.com"}],
    ["forgot", {email: "a@example.com"}], ["reset", {token: "token", new_password: "password-1234"}],
  ] as const;
  it.each(ops)("%s sends sanitized IP and preserves 429", async (op, body) => {
    vi.stubEnv("PORTAL_CLIENT_IP_SOURCE", "trusted-kong");
    const fetch = vi.fn().mockResolvedValue(new Response(JSON.stringify({error: "rate_limit_exceeded"}), {status: 429, headers: {"Retry-After": "900"}})); vi.stubGlobal("fetch", fetch);
    const res = await customerOperation(edge(body), op);
    expect(res.status).toBe(429); expect(res.headers.get("retry-after")).toBe("900");
    expect(await res.json()).toEqual({error: "rate_limit_exceeded"});
    exact(fetch.mock.calls[0][1].headers, {"content-type": "application/json"});
  });
  it("invite and selected context use the shared auth contract", async () => {
    vi.stubEnv("PORTAL_CLIENT_IP_SOURCE", "trusted-kong");
    const fetch = vi.fn().mockResolvedValueOnce(reply({code: 200, status: "success", message: "OK", data: {status: "activated"}})).mockResolvedValueOnce(reply([row()])).mockResolvedValueOnce(reply({access_token: "selected"})); vi.stubGlobal("fetch", fetch);
    expect((await acceptStaffInvite(edge({token: "token", password: "password-1234"}))).status).toBe(200);
    exact(fetch.mock.calls[0][1].headers, {"content-type": "application/json"});
    expect((await switchStaffContext(edge({org_id: "org-1", branch_id: "branch-1"}))).status).toBe(200);
    exact(fetch.mock.calls[2][1].headers, {"content-type": "application/json", authorization: "Bearer existing"});
  });
  it.each([undefined, "", "192.0.2.1, 192.0.2.1", "[::1]", "192.0.2.1:80", "fe80::1%eth0"])("invalid ingress %s returns 503 before auth fetch", async ip => {
    vi.stubEnv("PORTAL_CLIENT_IP_SOURCE", "trusted-kong");
    const fetch = vi.fn(); vi.stubGlobal("fetch", fetch);
    const req = edge(); if (ip === undefined) req.headers.delete("X-Real-IP"); else req.headers.set("X-Real-IP", ip);
    const res = await customer(req); expect(res.status).toBe(503); expect(await res.json()).toMatchObject({error: "INTERNAL_ERROR"}); expect(fetch).not.toHaveBeenCalled();
  });
  it("unset mode omits forwarding on real BFF calls and warns once", async () => {
    vi.stubEnv("PORTAL_CLIENT_IP_SOURCE", undefined);
    // Fresh process module state, without mocking the resolver or builder.
    vi.resetModules();
    const {customerOperation: operation} = await import("./auth-journey-bff");
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const fetch = vi.fn().mockImplementation(async () => reply({status: "accepted"})); vi.stubGlobal("fetch", fetch);
    await operation(edge({email: "a@example.com"}), "forgot"); await operation(edge({email: "a@example.com"}), "resend");
    expect(warn).toHaveBeenCalledTimes(1);
    for (const call of fetch.mock.calls) expect(Object.fromEntries(new Headers(call[1].headers))).toEqual({"content-type": "application/json"});
  });
  it("unknown mode returns 503 before fetch", async () => {
    vi.stubEnv("PORTAL_CLIENT_IP_SOURCE", "invalid"); const fetch = vi.fn(); vi.stubGlobal("fetch", fetch);
    expect((await customer(edge())).status).toBe(503); expect(fetch).not.toHaveBeenCalled();
  });
});
