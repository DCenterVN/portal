import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { NextRequest } from "next/server";
vi.mock("server-only", () => ({}));

import { POST as loginHandler } from "./login/route";
import { POST as logoutHandler } from "./logout/route";
import { POST as refreshHandler } from "./refresh/route";
import { POST as registerHandler } from "./register/route";
import { POST as activateHandler } from "./activate/route";
import { POST as resendHandler } from "./activate/resend/route";
import { POST as forgotHandler } from "./forgot/route";
import { POST as resetHandler } from "./reset/route";
import { GET as meHandler } from "./me/route";
import { POST as switchOrgHandler } from "./staff/switch-org/route";
import { GET as contextHandler } from "./context/route";

function expectSecureAccessTokenCookie(res: Response, value: string) {
  const cookie = res.headers.getSetCookie().find((item) => item.startsWith(`access_token=${value}`));
  expect(cookie).toBeDefined();
  expect(cookie).toMatch(/HttpOnly/i);
  expect(cookie).toMatch(/Secure/i);
  expect(cookie).toMatch(/SameSite=Strict/i);
}

describe("Portal BFF Auth Handlers (9 handlers)", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it("1. POST /api/auth/login sets cookies and forwards response", async () => {
    const mockHeaders = new Headers();
    mockHeaders.append("set-cookie", "refresh_token=rt-123; Path=/; HttpOnly");
    mockHeaders.append("set-cookie", "CSRF-Token=csrf-456; Path=/");

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: {
        getSetCookie: () => [
          "refresh_token=rt-123; Path=/; HttpOnly",
          "CSRF-Token=csrf-456; Path=/",
        ],
      },
      json: async () => ({ access_token: "jwt-token", expires_in: 900, user: { id: "u", status: "ACTIVE" }, id: "u", status: "ACTIVE" }),
    } as unknown as Response);

    const req = new NextRequest("http://localhost:3000/api/auth/login", {
      method: "POST", headers: {"Content-Type":"application/json", "Sec-Fetch-Site":"same-origin"},
      body: JSON.stringify({ identifier: "test@example.com", password: "Password123!" }),
    });

    const res = await loginHandler(req);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.access_token).toBeUndefined();
    expect(res.cookies.get("access_token")?.value).toBe("jwt-token");
    expectSecureAccessTokenCookie(res, "jwt-token");
  });

  it("2. POST /api/auth/logout calls upstream and clears all auth cookies", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ message: "ok" }),
    } as unknown as Response);

    const req = new NextRequest("http://localhost:3000/api/auth/logout", {
      method: "POST",
      headers: {
        "Content-Type":"application/json", "Sec-Fetch-Site":"same-origin",
        cookie: "access_token=token; refresh_token=rt; CSRF-Token=csrf",
      },
    });

    const res = await logoutHandler(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.message).toBe("logged_out");
  });

  it("3. POST /api/auth/refresh forwards cookies and updates access token", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: {
        getSetCookie: () => ["refresh_token=new-rt; Path=/; HttpOnly"],
      },
      json: async () => ({ access_token: "new-jwt-token" }),
    } as unknown as Response);

    const req = new NextRequest("http://localhost:3000/api/auth/refresh", {
      method: "POST",
      headers: {
        "Content-Type":"application/json", "Sec-Fetch-Site":"same-origin",
        cookie: "refresh_token=old-rt; CSRF-Token=csrf",
      },
    });

    const res = await refreshHandler(req);
    expect(res.status).toBe(200);
    expect((await res.json()).access_token).toBeUndefined();
    expect(res.cookies.get("access_token")?.value).toBe("new-jwt-token");
    expectSecureAccessTokenCookie(res, "new-jwt-token");
  });

  it("4. POST /api/auth/register forwards registration payload", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 202,
      headers: new Headers(),
      json: async () => ({ status: "pending_activation" }),
    } as unknown as Response);

    const req = new NextRequest("http://localhost:3000/api/auth/register", {
      method: "POST", headers: {"Content-Type":"application/json", "Sec-Fetch-Site":"same-origin"},
      body: JSON.stringify({ email: "reg@example.com", phone: "090123", password: "password-1234" }),
    });

    const res = await registerHandler(req);
    expect(res.status).toBe(202);
  });

  it("5. POST /api/auth/activate forwards activate token", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers(),
      json: async () => ({ status: "active" }),
    } as unknown as Response);

    const req = new NextRequest("http://localhost:3000/api/auth/activate", {
      method: "POST", headers: {"Content-Type":"application/json", "Sec-Fetch-Site":"same-origin"},
      body: JSON.stringify({ token: "act-tok-123" }),
    });

    const res = await activateHandler(req);
    expect(res.status).toBe(200);
  });

  it("6. POST /api/auth/forgot forwards forgot password request", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers(),
      json: async () => ({ message: "sent" }),
    } as unknown as Response);

    const req = new NextRequest("http://localhost:3000/api/auth/forgot", {
      method: "POST", headers: {"Content-Type":"application/json", "Sec-Fetch-Site":"same-origin"},
      body: JSON.stringify({ email: "user@example.com" }),
    });

    const res = await forgotHandler(req);
    expect(res.status).toBe(200);
  });

  it("7. POST /api/auth/reset forwards reset token and password", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers(),
      json: async () => ({ message: "password updated" }),
    } as unknown as Response);

    const req = new NextRequest("http://localhost:3000/api/auth/reset", {
      method: "POST", headers: {"Content-Type":"application/json", "Sec-Fetch-Site":"same-origin"},
      body: JSON.stringify({ token: "reset-123", new_password: "NewPassword123!" }),
    });

    const res = await resetHandler(req);
    expect(res.status).toBe(200);
  });

  it("8. GET /api/auth/me returns 401 when access token missing, and forwards when present", async () => {
    // Missing token -> 401 without upstream call
    const reqNoToken = new NextRequest("http://localhost:3000/api/auth/me");
    const res401 = await meHandler(reqNoToken);
    expect(res401.status).toBe(401);

    // Present token -> calls upstream with Authorization header
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ id: "u-1", email: "user@example.com", phone:"", display_name:"Test",status:"ACTIVE",created_at:"2026-10-26",memberships:[] }),
    } as unknown as Response);

    const reqWithToken = new NextRequest("http://localhost:3000/api/auth/me", {
      headers: {
        "Content-Type":"application/json", "Sec-Fetch-Site":"same-origin",
        cookie: "access_token=valid-jwt",
      },
    });

    const res200 = await meHandler(reqWithToken);
    expect(res200.status).toBe(200);
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/auth/me"),
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: "Bearer valid-jwt" }),
        cache: "no-store", signal: expect.any(AbortSignal),
      })
    );
  });

  it("9. POST /api/auth/staff/switch-org returns 401 when access token missing, and switches context when present", async () => {
    const reqNoToken = new NextRequest("http://localhost:3000/api/auth/staff/switch-org", {
      method: "POST", headers: {"Content-Type":"application/json", "Sec-Fetch-Site":"same-origin"},
      body: JSON.stringify({ org_id: "org-1" }),
    });
    const res401 = await switchOrgHandler(reqNoToken);
    expect(res401.status).toBe(401);

    const identityToken = "eyJhbGciOiJFUzI1NiJ9.eyJzdWIiOiJ1Iiwib3JnX2lkIjoibWFpbiIsImJyYW5jaF9pZCI6Im1haW4ifQ.signature";
    global.fetch = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify([{org_id:"main",branch_id:"main",member_type:"EMPLOYEE",status:"ACTIVE",roles:[]}])) )
      .mockResolvedValueOnce(new Response(JSON.stringify({action_keys:["org:company:read"]})));

    const reqWithToken = new NextRequest("http://localhost:3000/api/auth/staff/switch-org", {
      method: "POST",
      headers: {
        "Content-Type":"application/json", "Sec-Fetch-Site":"same-origin",
        cookie: `access_token=${identityToken}; refresh_token=existing-refresh`,
      },
      body: JSON.stringify({ org_id: "main", branch_id: "main" }),
    });

    const res200 = await switchOrgHandler(reqWithToken);
    expect(res200.status).toBe(200);
    expect((await res200.json()).access_token).toBeUndefined();
    expect(res200.cookies.get("access_token")).toBeUndefined();
    expect(res200.cookies.get("refresh_token")).toBeUndefined();
    expect(reqWithToken.cookies.get("access_token")?.value).toBe(identityToken);
    expect(reqWithToken.cookies.get("refresh_token")?.value).toBe("existing-refresh");
    expect(global.fetch).toHaveBeenCalledTimes(2);
    expect(global.fetch).toHaveBeenLastCalledWith(expect.stringContaining("/org/permissions/me?org_id=main&branch_id=main"), expect.objectContaining({headers: {Authorization: `Bearer ${identityToken}`}}));
  });
});

describe("Portal auth context fails closed", () => {
  it("does not translate an Org failure into empty permissions", async () => {
    global.fetch = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ id: "user-id" }), { status: 200, headers: { "content-type": "application/json" } }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ error: "internal" }), { status: 503, headers: { "content-type": "application/json" } }));
    const request = new NextRequest("http://localhost:3000/api/auth/context", { headers: { cookie: "access_token=jwt" } });
    const response = await contextHandler(request);
    expect(response.status).toBe(503);
    expect(await response.json()).toMatchObject({ error: "org_context_unavailable" });
  });
});

describe("S6 customer recovery BFF contract", () => {
  afterEach(() => vi.unstubAllGlobals());
  it.each([[forgotHandler, {email: "a@example.com"}, "/auth/password/forgot"], [resetHandler, {token: "reset-proof", new_password: "password-1234"}, "/auth/password/reset"]])("forwards exact DTO and endpoint, no-store, no session/token leakage", async (handler, body, path) => {
    const fetch = vi.fn().mockResolvedValue(new Response(JSON.stringify({message: "ok", access_token: "must-not-leak"}), {headers: {"set-cookie": "refresh_token=must-not-leak"}})); vi.stubGlobal("fetch", fetch);
    const res = await handler(new NextRequest("http://localhost/api/auth/recovery", {method: "POST", headers: {"Content-Type":"application/json", "Sec-Fetch-Site":"same-origin"}, body: JSON.stringify(body)}));
    expect(res.status).toBe(200); expect(res.headers.get("cache-control")).toBe("no-store"); expect(res.headers.get("set-cookie")).toBeNull(); expect(await res.json()).toEqual({message: "ok"});
    expect(fetch).toHaveBeenCalledWith(expect.stringContaining(path), expect.objectContaining({cache: "no-store", body: JSON.stringify(body)}));
  });
  it.each([[forgotHandler, {}], [forgotHandler, {email: []}], [forgotHandler, {email: "a", journey: "employee"}], [resetHandler, {new_password: "password-1234"}], [resetHandler, {token: [], new_password: "password-1234"}], [resetHandler, {token: "t", new_password: "short"}], [resetHandler, {token: "t", new_password: "é".repeat(129)}], [resetHandler, {token: "t", new_password: "a".repeat(257)}], [resetHandler, {token: "t", new_password: "password-1234", account_type: "EMPLOYEE"}]])("invalid/forged recovery DTO never hits auth", async (handler, body) => {
    const fetch = vi.fn(); vi.stubGlobal("fetch", fetch); const res = await handler(new NextRequest("http://localhost", {method: "POST", headers: {"Content-Type":"application/json", "Sec-Fetch-Site":"same-origin"}, body: JSON.stringify(body)})); expect(res.status).toBe(400); expect((await res.json()).error).toMatch(/^(BAD_REQUEST|VALIDATION_ERROR)$/); expect(fetch).not.toHaveBeenCalled();
  });
  it.each([forgotHandler, resetHandler])("bad JSON and upstream failure are canonical and no-store", async handler => {
    const fetch = vi.fn().mockRejectedValue(Error("sensitive transport detail")); vi.stubGlobal("fetch", fetch); const malformed = await handler(new NextRequest("http://localhost", {method: "POST", headers: {"Content-Type":"application/json", "Sec-Fetch-Site":"same-origin"}, body: "{"})); expect(malformed.status).toBe(400); expect(fetch).not.toHaveBeenCalled();
    const res = await handler(new NextRequest("http://localhost", {method: "POST", headers: {"Content-Type":"application/json", "Sec-Fetch-Site":"same-origin"}, body: JSON.stringify(handler === forgotHandler ? {email: "a@example.com"} : {token: "t", new_password: "password-1234"})})); expect(res.status).toBe(503); expect(await res.json()).toMatchObject({error: "INTERNAL_ERROR"}); expect(res.headers.get("cache-control")).toBe("no-store");
  });
  it.each([[400, "invalid_token"], [401, "UNAUTHORIZED"], [429, "rate_limit_exceeded"], [503, "service_busy"]])("reset preserves upstream error %s/%s, Retry-After; expired/replayed tokens do not succeed", async (status, error) => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({error}), {status, headers: {"Retry-After": "7"}})));
    const res = await resetHandler(new NextRequest("http://localhost", {method: "POST", headers: {"Content-Type":"application/json", "Sec-Fetch-Site":"same-origin"}, body: JSON.stringify({token: "expired-or-replayed", new_password: "password-1234"})})); expect(res.status).toBe(status); expect(await res.json()).toEqual({error}); expect(res.headers.get("retry-after")).toBe("7"); expect(res.headers.get("set-cookie")).toBeNull();
  });
});

describe("S7 customer onboarding BFF contract", () => {
  afterEach(() => vi.unstubAllGlobals());
  it.each([[registerHandler, {email: "a@example.com", password: "password-1234", display_name: "An"}, "/auth/register", 202], [registerHandler, {phone: "0901234567", password: "password-1234"}, "/auth/register", 202], [activateHandler, {token: "activation-proof"}, "/auth/activate", 200], [resendHandler, {email: "a@example.com"}, "/auth/activate/resend", 202]])("forwards only customer DTO/endpoint, preserves accepted status, no credential/cookie leaks", async (handler, body, path, status) => {
    const fetch = vi.fn().mockResolvedValue(new Response(JSON.stringify({status: "accepted", access_token: "secret", refresh_token: "secret", token: "secret"}), {status, headers: {"Set-Cookie": "refresh_token=secret"}})); vi.stubGlobal("fetch", fetch);
    const res = await handler(new NextRequest("http://localhost/api/auth/onboard", {method: "POST", headers: {"Content-Type":"application/json", "Sec-Fetch-Site":"same-origin"}, body: JSON.stringify(body)}));
    expect(res.status).toBe(status); expect(await res.json()).toEqual({status: "accepted"}); expect(res.headers.get("cache-control")).toBe("no-store"); expect(res.headers.get("set-cookie")).toBeNull();
    expect(fetch).toHaveBeenCalledTimes(1); expect(fetch).toHaveBeenCalledWith(expect.stringContaining(path), expect.objectContaining({body: JSON.stringify(body), cache: "no-store"}));
  });
  it.each([[registerHandler, {}], [registerHandler, {password: "password-1234"}], [registerHandler, {email: "a", password: "short"}], [registerHandler, {email: "a", password: "a".repeat(257)}], [registerHandler, {email: "a", password: "é".repeat(129)}], [registerHandler, {email: [], password: "password-1234"}], [registerHandler, {email: "a", password: "password-1234", display_name: "a".repeat(51)}], [registerHandler, {email: "a", password: "password-1234", roles: ["EMPLOYEE"]}], [registerHandler, {email: "a", password: "password-1234", account_type: "EMPLOYEE"}], [activateHandler, {}], [activateHandler, {token: null}], [activateHandler, {token: "t", purpose: "ACCEPT_INVITE"}], [resendHandler, {}], [resendHandler, {email: "a", journey: "employee"}]])("rejects missing/invalid/forged onboarding fields before auth", async (handler, body) => {
    const fetch = vi.fn(); vi.stubGlobal("fetch", fetch); const res = await handler(new NextRequest("http://localhost", {method: "POST", headers: {"Content-Type":"application/json", "Sec-Fetch-Site":"same-origin"}, body: JSON.stringify(body)})); expect(res.status).toBe(400); expect((await res.json()).error).toMatch(/^(BAD_REQUEST|VALIDATION_ERROR)$/); expect(fetch).not.toHaveBeenCalled();
  });
  it.each([registerHandler, activateHandler, resendHandler])("onboarding malformed JSON yields canonical BAD_REQUEST", async handler => {const fetch = vi.fn(); vi.stubGlobal("fetch", fetch); const res = await handler(new NextRequest("http://localhost", {method: "POST", headers: {"Content-Type":"application/json", "Sec-Fetch-Site":"same-origin"}, body: "{"})); expect(res.status).toBe(400); expect(await res.json()).toMatchObject({error: "BAD_REQUEST"}); expect(fetch).not.toHaveBeenCalled(); });
  it.each([[400, "invalid_token"], [429, "rate_limit_exceeded"], [503, "service_busy"]])("activation upstream denial/retry metadata survive %s/%s", async (status, error) => {vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({error}), {status, headers: {"Retry-After": "9"}}))); const res = await activateHandler(new NextRequest("http://localhost", {method: "POST", headers: {"Content-Type":"application/json", "Sec-Fetch-Site":"same-origin"}, body: JSON.stringify({token: "expired-or-replayed"})})); expect(res.status).toBe(status); expect(await res.json()).toEqual({error}); expect(res.headers.get("retry-after")).toBe("9"); expect(res.headers.get("set-cookie")).toBeNull(); });
  it("onboarding transport failures have canonical code and no internal detail", async () => {vi.stubGlobal("fetch", vi.fn().mockRejectedValue(Error("secret"))); const res = await registerHandler(new NextRequest("http://localhost", {method: "POST", headers: {"Content-Type":"application/json", "Sec-Fetch-Site":"same-origin"}, body: JSON.stringify({email: "a@example.com", password: "password-1234"})})); expect(res.status).toBe(503); expect(await res.json()).toMatchObject({error: "INTERNAL_ERROR"});  });
});
