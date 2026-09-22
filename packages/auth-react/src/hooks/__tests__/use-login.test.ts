import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useLogin } from "../use-login";

// Mock next/navigation
const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
  useSearchParams: () => new URLSearchParams(),
}));

// Mock auth api
vi.mock("@dcentervn/api-client", () => ({
  nativeLogin: vi.fn(),
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
const mockLoginSession = vi.fn();
vi.mock("../../context/auth-context", () => ({
  useAuthSession: () => ({
    login: mockLoginSession,
    user: null,
    accessToken: null,
    refreshToken: null,
    isAuthenticated: false,
    isLoading: false,
    logout: vi.fn(),
    updateUser: vi.fn(),
  }),
}));

import { nativeLogin, ApiResponseError } from "@dcentervn/api-client";

describe("useLogin Headless Logic Hook", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should initialize with empty values and no errors", () => {
    const { result } = renderHook(() => useLogin());

    expect(result.current.values.email).toBe("");
    expect(result.current.values.password).toBe("");
    expect(result.current.errors).toEqual({});
    expect(result.current.isSubmitting).toBe(false);
    expect(result.current.errorMessage).toBeNull();
  });

  it("should update form values via handleChange", () => {
    const { result } = renderHook(() => useLogin());

    act(() => {
      result.current.handleChange("email", "test@vietsach.vn");
      result.current.handleChange("password", "secret123");
    });

    expect(result.current.values.email).toBe("test@vietsach.vn");
    expect(result.current.values.password).toBe("secret123");
  });

  it("should fail client validation on empty submit", async () => {
    const { result } = renderHook(() => useLogin());

    let success = false;
    await act(async () => {
      success = await result.current.handleSubmit();
    });

    expect(success).toBe(false);
    expect(result.current.errors.email).toBe("Email là bắt buộc");
    expect(result.current.errors.password).toBe("Mật khẩu là bắt buộc");
    expect(nativeLogin).not.toHaveBeenCalled();
  });

  it("should fail client validation on invalid email or short password", async () => {
    const { result } = renderHook(() => useLogin());

    act(() => {
      result.current.handleChange("email", "invalid-email");
      result.current.handleChange("password", "123");
    });

    let success = false;
    await act(async () => {
      success = await result.current.handleSubmit();
    });

    expect(success).toBe(false);
    expect(result.current.errors.email).toBe("Định dạng email không hợp lệ");
    expect(result.current.errors.password).toBe("Mật khẩu phải có ít nhất 8 ký tự");
    expect(nativeLogin).not.toHaveBeenCalled();
  });

  it("should call nativeLogin and redirect on valid submission", async () => {
    vi.mocked(nativeLogin).mockResolvedValueOnce({
      access_token: "mock-access-token",
      refresh_token: "mock-refresh-token",
      token_type: "Bearer",
      expires_in: 900,
    });

    const { result } = renderHook(() => useLogin());

    act(() => {
      result.current.handleChange("email", "admin@vietsach.vn");
      result.current.handleChange("password", "password123");
    });

    let success = false;
    await act(async () => {
      success = await result.current.handleSubmit();
    });

    expect(success).toBe(true);
    expect(nativeLogin).toHaveBeenCalledWith({
      email: "admin@vietsach.vn",
      password: "password123",
    });
    expect(mockLoginSession).toHaveBeenCalledWith(
      "mock-access-token",
      "mock-refresh-token",
    );
    expect(mockPush).toHaveBeenCalledWith("/ops/dashboard");
  });

  it("should set error message when API returns 401 unauthorized", async () => {
    vi.mocked(nativeLogin).mockRejectedValueOnce(
      new ApiResponseError(401, "invalid_credentials", "Unauthorized"),
    );

    const { result } = renderHook(() => useLogin());

    act(() => {
      result.current.handleChange("email", "admin@vietsach.vn");
      result.current.handleChange("password", "wrongpassword");
    });

    let success = false;
    await act(async () => {
      success = await result.current.handleSubmit();
    });

    expect(success).toBe(false);
    expect(result.current.errorMessage).toContain(
      "Thông tin đăng nhập hoặc mật khẩu không đúng",
    );
    expect(mockPush).not.toHaveBeenCalled();
  });
});
