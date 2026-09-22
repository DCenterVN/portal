import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useEmailConfirm } from "../use-email-confirm";

// Mock next/navigation
let mockQueryToken: string | null = null;
vi.mock("next/navigation", () => ({
  useSearchParams: () => ({
    get: (param: string) => (param === "token" ? mockQueryToken : null),
  }),
}));

// Mock auth api
vi.mock("@dcentervn/api-client", () => ({
  confirmEmailChange: vi.fn(),
  ApiResponseError: class extends Error {
    constructor(
      public status: number,
      public code: string,
      message: string,
    ) {
      super(message);
      this.name = "ApiResponseError";
    }
  },
}));

// Mock auth-context
const mockLogout = vi.fn();
let currentToken: string | null = "valid-access-token";

vi.mock("../../context/auth-context", () => ({
  useAuthSession: () => ({
    accessToken: currentToken,
    logout: mockLogout,
    isAuthenticated: !!currentToken,
  }),
}));

import { confirmEmailChange, ApiResponseError } from "@dcentervn/api-client";

describe("useEmailConfirm Headless Logic Hook", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    currentToken = "valid-access-token";
    mockQueryToken = null;
  });

  it("should initialize with token from URL query params", () => {
    mockQueryToken = "query-token-123";
    const { result } = renderHook(() => useEmailConfirm());

    expect(result.current.token).toBe("query-token-123");
    expect(result.current.isSuccess).toBe(false);
  });

  it("should auto-submit when token is present in URL and user is logged in", async () => {
    mockQueryToken = "query-token-123";
    vi.mocked(confirmEmailChange).mockResolvedValueOnce(undefined as any);

    const { result } = renderHook(() => useEmailConfirm());

    await act(async () => {
      await Promise.resolve();
    });

    expect(confirmEmailChange).toHaveBeenCalledWith(
      { token: "query-token-123" },
      "valid-access-token",
    );
    expect(result.current.isSuccess).toBe(true);
    expect(mockLogout).toHaveBeenCalled();
  });

  it("should fail validation when token is empty", async () => {
    const { result } = renderHook(() => useEmailConfirm());

    let success = false;
    await act(async () => {
      success = await result.current.handleSubmit("");
    });

    expect(success).toBe(false);
    expect(result.current.errorMessage).toBe("Mã xác thực là bắt buộc");
  });

  it("should fail when session has expired", async () => {
    currentToken = null;
    const { result } = renderHook(() => useEmailConfirm());

    let success = false;
    await act(async () => {
      success = await result.current.handleSubmit("valid-token");
    });

    expect(success).toBe(false);
    expect(result.current.errorMessage).toContain("Phiên đăng nhập đã hết hạn");
  });

  it("should handle invalid or expired verification token error", async () => {
    vi.mocked(confirmEmailChange).mockRejectedValueOnce(
      new ApiResponseError(400, "invalid_token", "Mã xác nhận không hợp lệ"),
    );

    const { result } = renderHook(() => useEmailConfirm());

    let success = false;
    await act(async () => {
      success = await result.current.handleSubmit("expired-token");
    });

    expect(success).toBe(false);
    expect(result.current.errorMessage).toContain("Mã xác nhận không hợp lệ");
    expect(result.current.isSuccess).toBe(false);
  });
});
