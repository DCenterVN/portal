import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useForgotPassword } from "../use-forgot-password";

vi.mock("@dcentervn/api-client", () => ({
  forgotPassword: vi.fn(),
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

import { forgotPassword, ApiResponseError } from "@dcentervn/api-client";

describe("useForgotPassword Headless Logic Hook", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should initialize with default states", () => {
    const { result } = renderHook(() => useForgotPassword());

    expect(result.current.email).toBe("");
    expect(result.current.error).toBeUndefined();
    expect(result.current.isSubmitting).toBe(false);
    expect(result.current.errorMessage).toBeNull();
    expect(result.current.isSuccess).toBe(false);
  });

  it("should validate required email field", async () => {
    const { result } = renderHook(() => useForgotPassword());

    let success = false;
    await act(async () => {
      success = await result.current.handleSubmit();
    });

    expect(success).toBe(false);
    expect(result.current.error).toBe("Email là bắt buộc");
    expect(forgotPassword).not.toHaveBeenCalled();
  });

  it("should reject invalid email format", async () => {
    const { result } = renderHook(() => useForgotPassword());

    act(() => {
      result.current.setEmail("invalid-email-address");
    });

    let success = false;
    await act(async () => {
      success = await result.current.handleSubmit();
    });

    expect(success).toBe(false);
    expect(result.current.error).toBe("Định dạng email không hợp lệ");
    expect(forgotPassword).not.toHaveBeenCalled();
  });

  it("should call forgotPassword API on valid email", async () => {
    vi.mocked(forgotPassword).mockResolvedValueOnce(undefined as any);

    const { result } = renderHook(() => useForgotPassword());

    act(() => {
      result.current.setEmail("user@vietsach.vn");
    });

    let success = false;
    await act(async () => {
      success = await result.current.handleSubmit();
    });

    expect(success).toBe(true);
    expect(forgotPassword).toHaveBeenCalledWith({ email: "user@vietsach.vn" });
    expect(result.current.isSuccess).toBe(true);
  });

  it("should handle 429 rate limit error", async () => {
    vi.mocked(forgotPassword).mockRejectedValueOnce(
      new ApiResponseError(429, "rate_limit_exceeded", "Too many requests"),
    );

    const { result } = renderHook(() => useForgotPassword());

    act(() => {
      result.current.setEmail("user@vietsach.vn");
    });

    let success = false;
    await act(async () => {
      success = await result.current.handleSubmit();
    });

    expect(success).toBe(false);
    expect(result.current.errorMessage).toContain("quá nhiều yêu cầu");
    expect(result.current.isSuccess).toBe(false);
  });
});
