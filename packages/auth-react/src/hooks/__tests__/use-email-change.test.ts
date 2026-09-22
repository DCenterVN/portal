import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useEmailChange } from "../use-email-change";

// Mock auth api
vi.mock("@dcentervn/api-client", () => ({
  requestEmailChange: vi.fn(),
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
const mockAccessToken = "mock-valid-token";
let currentToken: string | null = mockAccessToken;

vi.mock("../../context/auth-context", () => ({
  useAuthSession: () => ({
    accessToken: currentToken,
    user: { id: "u-1", email: "old@vietsach.vn" },
    isAuthenticated: !!currentToken,
  }),
}));

import { requestEmailChange, ApiResponseError } from "@dcentervn/api-client";

describe("useEmailChange Headless Logic Hook", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    currentToken = mockAccessToken;
  });

  it("should initialize with default states", () => {
    const { result } = renderHook(() => useEmailChange());

    expect(result.current.newEmail).toBe("");
    expect(result.current.currentPassword).toBe("");
    expect(result.current.errors).toEqual({});
    expect(result.current.isSubmitting).toBe(false);
    expect(result.current.errorMessage).toBeNull();
    expect(result.current.isSuccess).toBe(false);
  });

  it("should validate required fields", async () => {
    const { result } = renderHook(() => useEmailChange());

    let success = false;
    await act(async () => {
      success = await result.current.handleSubmit();
    });

    expect(success).toBe(false);
    expect(result.current.errors.newEmail).toBe("Email mới là bắt buộc");
    expect(result.current.errors.currentPassword).toBe("Mật khẩu hiện tại là bắt buộc");
    expect(requestEmailChange).not.toHaveBeenCalled();
  });

  it("should reject invalid email format", async () => {
    const { result } = renderHook(() => useEmailChange());

    act(() => {
      result.current.setNewEmail("not-an-email");
      result.current.setCurrentPassword("mypassword");
    });

    let success = false;
    await act(async () => {
      success = await result.current.handleSubmit();
    });

    expect(success).toBe(false);
    expect(result.current.errors.newEmail).toBe("Định dạng email mới không hợp lệ");
    expect(requestEmailChange).not.toHaveBeenCalled();
  });

  it("should fail if user is not authenticated", async () => {
    currentToken = null; // No token
    const { result } = renderHook(() => useEmailChange());

    act(() => {
      result.current.setNewEmail("new@vietsach.vn");
      result.current.setCurrentPassword("mypassword");
    });

    let success = false;
    await act(async () => {
      success = await result.current.handleSubmit();
    });

    expect(success).toBe(false);
    expect(result.current.errorMessage).toContain("Vui lòng đăng nhập");
    expect(requestEmailChange).not.toHaveBeenCalled();
  });

  it("should successfully request email change on valid input", async () => {
    vi.mocked(requestEmailChange).mockResolvedValueOnce(undefined as any);

    const { result } = renderHook(() => useEmailChange());

    act(() => {
      result.current.setNewEmail("new@vietsach.vn");
      result.current.setCurrentPassword("correctpassword");
    });

    let success = false;
    await act(async () => {
      success = await result.current.handleSubmit();
    });

    expect(success).toBe(true);
    expect(requestEmailChange).toHaveBeenCalledWith(
      {
        new_email: "new@vietsach.vn",
        current_password: "correctpassword",
      },
      "mock-valid-token",
    );
    expect(result.current.isSuccess).toBe(true);
    expect(result.current.errorMessage).toBeNull();
  });

  it("should handle 401 incorrect password error", async () => {
    vi.mocked(requestEmailChange).mockRejectedValueOnce(
      new ApiResponseError(401, "invalid_credentials", "Unauthorized"),
    );

    const { result } = renderHook(() => useEmailChange());

    act(() => {
      result.current.setNewEmail("new@vietsach.vn");
      result.current.setCurrentPassword("wrongpassword");
    });

    let success = false;
    await act(async () => {
      success = await result.current.handleSubmit();
    });

    expect(success).toBe(false);
    expect(result.current.errorMessage).toContain("Mật khẩu hiện tại không chính xác");
    expect(result.current.isSuccess).toBe(false);
  });

  it("should handle 409 email already in use error", async () => {
    vi.mocked(requestEmailChange).mockRejectedValueOnce(
      new ApiResponseError(409, "email_conflict", "Conflict"),
    );

    const { result } = renderHook(() => useEmailChange());

    act(() => {
      result.current.setNewEmail("taken@vietsach.vn");
      result.current.setCurrentPassword("mypassword");
    });

    let success = false;
    await act(async () => {
      success = await result.current.handleSubmit();
    });

    expect(success).toBe(false);
    expect(result.current.errorMessage).toContain("Email này đã được sử dụng");
  });
});
