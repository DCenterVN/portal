import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { proxy } from "./proxy";

function request(path: string, cookie?: string) {
  return new NextRequest(`http://localhost:3000${path}`, {
    headers: cookie ? { cookie } : undefined,
  });
}

describe("portal proxy route boundary", () => {
  it("allows exact public routes and their descendants", () => {
    expect(proxy(request("/login")).status).toBe(200);
    expect(proxy(request("/api/auth/refresh")).status).toBe(200);
    expect(proxy(request("/traceability/TRC-1")).status).toBe(200);
    expect(proxy(request("/api/public/traceability/TRC-1")).status).toBe(200);
  });

  it("does not treat a matching string prefix as a public route", () => {
    const loginLookalike = proxy(request("/login-evil"));
    const apiLookalike = proxy(request("/api/authentic"));
    const traceLookalike = proxy(request("/traceability-evil"));

    expect(loginLookalike.status).toBe(307);
    expect(loginLookalike.headers.get("location")).toContain("/login?redirect=%2Flogin-evil");
    expect(apiLookalike.status).toBe(307);
    expect(traceLookalike.status).toBe(307);
  });

  it("accepts access or refresh session cookies for protected routes", () => {
    expect(proxy(request("/orders", "access_token=jwt")).status).toBe(200);
    expect(proxy(request("/orders", "__Host-refresh_token=refresh")).status).toBe(200);
  });
});
