import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useDashboard } from "../use-dashboard";

vi.mock("@dcentervn/auth-react", () => ({
  useAuthSession: () => ({
    user: {
      id: "u-1",
      email: "gm@vietsach.vn",
      displayName: "Tổng Giám Đốc",
      status: "ACTIVE",
    },
    accessToken: "mock-token",
    refreshToken: null,
    isAuthenticated: true,
    isLoading: false,
    login: vi.fn(),
    logout: vi.fn(),
    updateUser: vi.fn(),
  }),
}));

describe("useDashboard Headless Logic Hook", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("loads metrics and operational activities on mount", async () => {
    const { result } = renderHook(() => useDashboard());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.user?.displayName).toBe("Tổng Giám Đốc");
    expect(result.current.metrics.length).toBeGreaterThan(0);
    expect(result.current.activities.length).toBeGreaterThan(0);

    const occupancy = result.current.metrics.find((m) => m.id === "occupancy");
    expect(occupancy).toBeDefined();
    expect(occupancy?.value).toBe("84.2%");
  });
});
