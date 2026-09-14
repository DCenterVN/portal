import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  login,
  register,
  activateAccount,
  forgotPassword,
  resetPassword,
  logout,
  getProfile,
  switchOrg,
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
    it("login should post to /api/auth/login and return response", async () => {
      const mockLoginRes = {
        expires_in: 900,
        user: { id: "u-1", email: "user@example.com", phone: "090", display_name: "U1", status: "ACTIVE" },
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => mockLoginRes,
      } as unknown as Response);

      const res = await login("user@example.com", "Password123!");
      expect(res).toEqual(mockLoginRes);
      expect(global.fetch).toHaveBeenCalledWith(new URL("/api/auth/login", "http://127.0.0.1:3000"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "user@example.com", password: "Password123!" }),
      });
    });

    it("login should throw localized error on 401 failure", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        json: async () => ({ message: "Email hoặc mật khẩu không đúng" }),
      } as unknown as Response);

      await expect(login("user@example.com", "WrongPass")).rejects.toThrow("Email hoặc mật khẩu không đúng");
    });

    it("register should post payload to /api/auth/register", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ status: "accepted" }),
      } as unknown as Response);

      await register("new@example.com", "090123", "New User", "Pass123!");
      expect(global.fetch).toHaveBeenCalledWith(new URL("/api/auth/register", "http://127.0.0.1:3000"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "new@example.com", phone: "090123", display_name: "New User", password: "Pass123!" }),
      });
    });

    it("activateAccount should post token to /api/auth/activate", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ status: "active" }),
      } as unknown as Response);

      await activateAccount("act-token-123");
      expect(global.fetch).toHaveBeenCalledWith(new URL("/api/auth/activate", "http://127.0.0.1:3000"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: "act-token-123" }),
      });
    });

    it("forgotPassword should post email to /api/auth/forgot", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ message: "Đã gửi email đặt lại mật khẩu" }),
      } as unknown as Response);

      const msg = await forgotPassword("forgot@example.com");
      expect(msg).toBe("Đã gửi email đặt lại mật khẩu");
    });

    it("resetPassword should post token and new password to /api/auth/reset", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ message: "Đặt lại mật khẩu thành công" }),
      } as unknown as Response);

      const msg = await resetPassword("reset-tok-123", "NewPass999!");
      expect(msg).toBe("Đặt lại mật khẩu thành công");
    });

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
      expect(profile).toEqual(mockProfile);
    });

    it("switchOrg should post to /api/auth/switch-org", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ expires_in: 900 }),
      } as unknown as Response);

      const res = await switchOrg("org-123", "branch-456");
      expect(res.access_token).toBeUndefined();
      expect(res.expires_in).toBe(900);
    });
  });
});
