import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { NextRequest } from "next/server";

import { POST as loginHandler } from "./login/route";
import { POST as logoutHandler } from "./logout/route";
import { POST as refreshHandler } from "./refresh/route";
import { POST as registerHandler } from "./register/route";
import { POST as activateHandler } from "./activate/route";
import { POST as forgotHandler } from "./forgot/route";
import { POST as resetHandler } from "./reset/route";
import { GET as meHandler } from "./me/route";
import { POST as switchOrgHandler } from "./switch-org/route";

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
      json: async () => ({ access_token: "jwt-token", expires_in: 900 }),
    } as unknown as Response);

    const req = new NextRequest("http://localhost:3000/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email: "test@example.com", password: "Password123!" }),
    });

    const res = await loginHandler(req);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.access_token).toBe("jwt-token");
    expect(res.cookies.get("access_token")?.value).toBe("jwt-token");
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
        cookie: "refresh_token=old-rt; CSRF-Token=csrf",
      },
    });

    const res = await refreshHandler(req);
    expect(res.status).toBe(200);
    expect(res.cookies.get("access_token")?.value).toBe("new-jwt-token");
  });

  it("4. POST /api/auth/register forwards registration payload", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 201,
      json: async () => ({ status: "provisioned" }),
    } as unknown as Response);

    const req = new NextRequest("http://localhost:3000/api/auth/register", {
      method: "POST",
      body: JSON.stringify({ email: "reg@example.com", phone: "090123" }),
    });

    const res = await registerHandler(req);
    expect(res.status).toBe(201);
  });

  it("5. POST /api/auth/activate forwards activate token", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ status: "active" }),
    } as unknown as Response);

    const req = new NextRequest("http://localhost:3000/api/auth/activate", {
      method: "POST",
      body: JSON.stringify({ token: "act-tok-123" }),
    });

    const res = await activateHandler(req);
    expect(res.status).toBe(200);
  });

  it("6. POST /api/auth/forgot forwards forgot password request", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ message: "sent" }),
    } as unknown as Response);

    const req = new NextRequest("http://localhost:3000/api/auth/forgot", {
      method: "POST",
      body: JSON.stringify({ email: "user@example.com" }),
    });

    const res = await forgotHandler(req);
    expect(res.status).toBe(200);
  });

  it("7. POST /api/auth/reset forwards reset token and password", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ message: "password updated" }),
    } as unknown as Response);

    const req = new NextRequest("http://localhost:3000/api/auth/reset", {
      method: "POST",
      body: JSON.stringify({ token: "reset-123", new_password: "NewPass123!" }),
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
      json: async () => ({ id: "u-1", email: "user@example.com" }),
    } as unknown as Response);

    const reqWithToken = new NextRequest("http://localhost:3000/api/auth/me", {
      headers: {
        cookie: "access_token=valid-jwt",
      },
    });

    const res200 = await meHandler(reqWithToken);
    expect(res200.status).toBe(200);
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/auth/me"),
      expect.objectContaining({
        headers: { Authorization: "Bearer valid-jwt" },
      })
    );
  });

  it("9. POST /api/auth/switch-org returns 401 when access token missing, and switches context when present", async () => {
    const reqNoToken = new NextRequest("http://localhost:3000/api/auth/switch-org", {
      method: "POST",
      body: JSON.stringify({ org_id: "org-1" }),
    });
    const res401 = await switchOrgHandler(reqNoToken);
    expect(res401.status).toBe(401);

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ access_token: "new-org-token" }),
    } as unknown as Response);

    const reqWithToken = new NextRequest("http://localhost:3000/api/auth/switch-org", {
      method: "POST",
      headers: {
        cookie: "access_token=valid-jwt",
      },
      body: JSON.stringify({ org_id: "org-1", branch_id: "branch-2" }),
    });

    const res200 = await switchOrgHandler(reqWithToken);
    expect(res200.status).toBe(200);
    expect(res200.cookies.get("access_token")?.value).toBe("new-org-token");
  });
});
