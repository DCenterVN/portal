import * as shared from "./client";
import { existsSync } from "node:fs";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  logout,
  getProfile,
  sanitizeNextUrl,
  sanitizeRedirectUrl,
} from "./client";

describe("portal/lib/auth/client", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  describe("sanitizeRedirectUrl & sanitizeNextUrl (Open Redirect Prevention)", () => {
    it("should allow safe relative paths", () => {
      expect(sanitizeRedirectUrl("/memberships")).toBe("/memberships");
      expect(sanitizeRedirectUrl("/settings/profile")).toBe("/settings/profile");
      expect(sanitizeRedirectUrl("/orders?page=2&status=active")).toBe("/orders?page=2&status=active");
      expect(sanitizeNextUrl("/dashboard")).toBe("/dashboard");
    });

    it("should reject external absolute URLs and fallback to default", () => {
      expect(sanitizeRedirectUrl("https://evil.com")).toBe("/");
      expect(sanitizeRedirectUrl("http://attacker.org/phishing")).toBe("/");
      expect(sanitizeRedirectUrl("//evil.com")).toBe("/");
      expect(sanitizeRedirectUrl("/\\evil.com")).toBe("/");
      expect(sanitizeRedirectUrl("javascript:alert(1)")).toBe("/");

      // sanitizeNextUrl defaults to /dashboard
      expect(sanitizeNextUrl("https://evil.com")).toBe("/dashboard");
      expect(sanitizeNextUrl("//evil.com")).toBe("/dashboard");
      expect(sanitizeNextUrl("/\\evil.com")).toBe("/dashboard");
    });

    it("should handle null, undefined, or whitespace gracefully", () => {
      expect(sanitizeRedirectUrl(null)).toBe("/");
      expect(sanitizeRedirectUrl(undefined)).toBe("/");
      expect(sanitizeRedirectUrl("")).toBe("/");
      expect(sanitizeRedirectUrl("   ")).toBe("/");
    });
  });

  describe("API Client Functions", () => {
    it("logout should post to /api/auth/logout", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
      } as unknown as Response);

      await logout();
      expect(global.fetch).toHaveBeenCalledWith(new URL("/api/auth/logout", "http://127.0.0.1:3000"), { method: "POST" });
    });

    it("getProfile should get /api/auth/me", async () => {
      const mockProfile = {
        id: "u-1",
        email: "user@example.com",
        phone: "090",
        display_name: "U1",
        status: "ACTIVE",
        created_at: "2026-08-26",
        memberships: [],
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => mockProfile,
      } as unknown as Response);

      const profile = await getProfile();
      expect(profile).toEqual({...mockProfile, avatar_key:null, avatar_url:null});
    });


  });
});


it("S14 shared transport exports no journey operations and retires legacy switch BFFs", () => {
  for (const name of ["login","register","activateAccount","resendActivation","forgotPassword","resetPassword","switchOrg","switchBranch"]) expect(Object.keys(shared)).not.toContain(name);
  for (const file of ["app/api/auth/switch-branch/route.ts","app/api/auth/switch-org/route.ts"]) expect(existsSync(file), file + ": legacy BFF still exists").toBe(false);
});
