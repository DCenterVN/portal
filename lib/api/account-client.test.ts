import { afterEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
vi.mock("server-only", () => ({}));
import { changePassword, confirmEmailChange } from "./account-client";
import { accountMutation } from "./account-bff";

const json = (status: number, body: unknown, headers: Record<string, string> = {}) => new Response(JSON.stringify(body), { status, headers });
const originalFetch = global.fetch;

afterEach(() => {
  global.fetch = originalFetch;
  vi.unstubAllEnvs();
});

describe("account mutations and session refresh", () => {
  it("a mutation rejected before auth because the access cookie is gone refreshes once and replays", async () => {
    let refreshed = false;
    const calls: string[] = [];
    global.fetch = vi.fn(async (url: unknown) => {
      const path = new URL(String(url), "http://portal.invalid").pathname;
      calls.push(path);
      if (path === "/api/auth/refresh") { refreshed = true; return json(200, {}); }
      return refreshed ? json(200, { status: "success" }) : json(401, { error: "UNAUTHORIZED" }, { "x-session-missing": "1" });
    }) as typeof fetch;
    await expect(confirmEmailChange({ token: "t" } as never)).resolves.toEqual({ status: "success" });
    expect(calls).toEqual(["/api/auth/email/confirm", "/api/auth/refresh", "/api/auth/email/confirm"]);
  });

  it("a wrong current password is never refreshed or replayed", async () => {
    const fetchMock = vi.fn(async () => json(401, { error: "UNAUTHORIZED" }));
    global.fetch = fetchMock as typeof fetch;
    await expect(changePassword({ current_password: "x", new_password: "y" } as never)).rejects.toMatchObject({ status: 401 });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("the BFF marks a missing access cookie so the client can tell it from a wrong password", async () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://portal.test");
    const req = new NextRequest("https://portal.test/api/auth/email/confirm", { method: "POST", headers: { origin: "https://portal.test", "content-type": "application/json" }, body: "{}" });
    const res = await accountMutation(req, "emailConfirm");
    expect(res.status).toBe(401);
    expect(res.headers.get("x-session-missing")).toBe("1");
  });

  it("a password change clears the session with the shared cleaner, including the domain-scoped CSRF-Token", async () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://portal.test");
    vi.stubEnv("AUTH_COOKIE_DOMAIN", ".example.test");
    global.fetch = vi.fn(async () => new Response(null, { status: 204 })) as typeof fetch;
    const req = new NextRequest("https://portal.test/api/auth/password/change", {
      method: "POST",
      headers: { origin: "https://portal.test", "content-type": "application/json", cookie: "access_token=a; refresh_token=r; CSRF-Token=c" },
      body: JSON.stringify({ current_password: "old-password-1234", new_password: "new-password-1234" }),
    });
    const res = await accountMutation(req, "password");
    expect(res.status).toBe(204);
    const lines = res.headers.getSetCookie();
    for (const name of ["access_token", "refresh_token", "__Host-refresh_token", "CSRF-Token", "portal_plane"]) {
      expect(lines.some((line) => line.startsWith(`${name}=;`) && /Max-Age=0/i.test(line) && !/Domain=/i.test(line))).toBe(true);
    }
    expect(lines.some((line) => line.startsWith("CSRF-Token=;") && /Domain=\.example\.test/i.test(line))).toBe(true);
  });
});
