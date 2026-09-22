import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useActivate } from "../use-activate";

let mockQueryToken: string | null = null;
vi.mock("next/navigation", () => ({
  useSearchParams: () => ({
    get: (param: string) => (param === "token" ? mockQueryToken : null),
  }),
}));

vi.mock("@dcentervn/api-client", () => ({
  activate: vi.fn(),
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

import { activate, ApiResponseError } from "@dcentervn/api-client";

describe("useActivate Headless Logic Hook", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockQueryToken = null;
  });

  it("should initialize with default states when no token in URL", () => {
    const { result } = renderHook(() => useActivate());

    expect(result.current.token).toBe("");
    expect(result.current.isSubmitting).toBe(false);
    expect(result.current.errorMessage).toBeNull();
    expect(result.current.isSuccess).toBe(false);
  });

  it("should auto-submit when token is present in URL", async () => {
    mockQueryToken = "act-token-123";
    vi.mocked(activate).mockResolvedValueOnce(undefined as any);

    const { result } = renderHook(() => useActivate());

    await act(async () => {
      await Promise.resolve();
    });

    expect(activate).toHaveBeenCalledWith({ token: "act-token-123" });
    expect(result.current.isSuccess).toBe(true);
  });

  it("should fail validation when token is empty", async () => {
    const { result } = renderHook(() => useActivate());

    let success = false;
    await act(async () => {
      success = await result.current.handleSubmit("");
    });

    expect(success).toBe(false);
    expect(result.current.errorMessage).toBe("Mã kích hoạt là bắt buộc");
    expect(activate).not.toHaveBeenCalled();
  });

  it("should handle invalid or expired token error from API", async () => {
    vi.mocked(activate).mockRejectedValueOnce(
      new ApiResponseError(400, "invalid_token", "Mã kích hoạt không hợp lệ hoặc đã hết hạn."),
    );

    const { result } = renderHook(() => useActivate());

    let success = false;
    await act(async () => {
      success = await result.current.handleSubmit("bad-token");
    });

    expect(success).toBe(false);
    expect(result.current.errorMessage).toContain("Mã kích hoạt không hợp lệ");
    expect(result.current.isSuccess).toBe(false);
  });
});
