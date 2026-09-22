import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useResetPassword } from "../use-reset-password";

let mockQueryToken: string | null = null;
const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useSearchParams: () => ({
    get: (param: string) => (param === "token" ? mockQueryToken : null),
  }),
  useRouter: () => ({
    push: mockPush,
  }),
}));

vi.mock("@dcentervn/api-client", () => ({
  resetPassword: vi.fn(),
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

import { resetPassword, ApiResponseError } from "@dcentervn/api-client";

describe("useResetPassword Headless Logic Hook", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockQueryToken = null;
  });

  it("should initialize with default states and token from query if available", () => {
    mockQueryToken = "token-xyz";
    const { result } = renderHook(() => useResetPassword());

    expect(result.current.token).toBe("token-xyz");
    expect(result.current.newPassword).toBe("");
    expect(result.current.confirmPassword).toBe("");
    expect(result.current.errors).toEqual({});
  });

  it("should validate required fields and matching passwords", async () => {
    const { result } = renderHook(() => useResetPassword());

    let success = false;
    await act(async () => {
      success = await result.current.handleSubmit();
    });

    expect(success).toBe(false);
    expect(result.current.errors.token).toBe("Mã token là bắt buộc");
    expect(result.current.errors.newPassword).toBe("Mật khẩu mới là bắt buộc");

    act(() => {
      result.current.setToken("token-xyz");
      result.current.setNewPassword("pass12345");
      result.current.setConfirmPassword("differentpass");
    });

    await act(async () => {
      success = await result.current.handleSubmit();
    });

    expect(success).toBe(false);
    expect(result.current.errors.confirmPassword).toBe("Mật khẩu xác nhận không khớp");
  });

  it("should call resetPassword on valid input", async () => {
    vi.mocked(resetPassword).mockResolvedValueOnce(undefined as any);

    const { result } = renderHook(() => useResetPassword());

    act(() => {
      result.current.setToken("valid-token");
      result.current.setNewPassword("strongpassword123");
      result.current.setConfirmPassword("strongpassword123");
    });

    let success = false;
    await act(async () => {
      success = await result.current.handleSubmit();
    });

    expect(success).toBe(true);
    expect(resetPassword).toHaveBeenCalledWith({
      token: "valid-token",
      new_password: "strongpassword123",
    });
    expect(result.current.isSuccess).toBe(true);
  });

  it("should handle error from API", async () => {
    vi.mocked(resetPassword).mockRejectedValueOnce(
      new ApiResponseError(400, "invalid_token", "Mã token không hợp lệ hoặc đã hết hạn."),
    );

    const { result } = renderHook(() => useResetPassword());

    act(() => {
      result.current.setToken("expired-token");
      result.current.setNewPassword("strongpassword123");
      result.current.setConfirmPassword("strongpassword123");
    });

    let success = false;
    await act(async () => {
      success = await result.current.handleSubmit();
    });

    expect(success).toBe(false);
    expect(result.current.errorMessage).toContain("Mã token không hợp lệ");
  });
});
