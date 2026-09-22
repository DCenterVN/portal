import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useRegister } from "../use-register";

// Mock auth api
vi.mock("@dcentervn/api-client", () => ({
  register: vi.fn(),
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

import { register, ApiResponseError } from "@dcentervn/api-client";

describe("useRegister Headless Logic Hook", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should initialize with default state", () => {
    const { result } = renderHook(() => useRegister());

    expect(result.current.values.displayName).toBe("");
    expect(result.current.values.email).toBe("");
    expect(result.current.values.password).toBe("");
    expect(result.current.values.phone).toBe("");
    expect(result.current.isSubmitting).toBe(false);
    expect(result.current.isSuccess).toBe(false);
  });

  it("should validate required fields", async () => {
    const { result } = renderHook(() => useRegister());

    let success = false;
    await act(async () => {
      success = await result.current.handleSubmit();
    });

    expect(success).toBe(false);
    expect(result.current.errors.displayName).toBe("Tên hiển thị là bắt buộc");
    expect(result.current.errors.email).toBe("Email là bắt buộc");
    expect(result.current.errors.password).toBe("Mật khẩu là bắt buộc");
    expect(register).not.toHaveBeenCalled();
  });

  it("should register successfully and set isSuccess = true", async () => {
    vi.mocked(register).mockResolvedValueOnce(undefined as any);

    const { result } = renderHook(() => useRegister());

    act(() => {
      result.current.handleChange("displayName", "Nguyễn Văn A");
      result.current.handleChange("email", "nva@vietsach.vn");
      result.current.handleChange("password", "securepassword123");
    });

    let success = false;
    await act(async () => {
      success = await result.current.handleSubmit();
    });

    expect(success).toBe(true);
    expect(result.current.isSuccess).toBe(true);
    expect(register).toHaveBeenCalledWith({
      display_name: "Nguyễn Văn A",
      email: "nva@vietsach.vn",
      password: "securepassword123",
      phone: undefined,
    });
  });

  it("should handle 409 conflict when email is already registered", async () => {
    vi.mocked(register).mockRejectedValueOnce(
      new ApiResponseError(409, "conflict", "email already registered"),
    );

    const { result } = renderHook(() => useRegister());

    act(() => {
      result.current.handleChange("displayName", "Admin");
      result.current.handleChange("email", "existing@vietsach.vn");
      result.current.handleChange("password", "securepassword123");
    });

    let success = false;
    await act(async () => {
      success = await result.current.handleSubmit();
    });

    expect(success).toBe(false);
    expect(result.current.errorMessage).toContain(
      "Email hoặc số điện thoại này đã được đăng ký",
    );
  });
});
