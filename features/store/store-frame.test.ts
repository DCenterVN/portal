import { beforeEach, describe, expect, it, vi } from "vitest";
import { apiFetch } from "@/lib/fetcher";
import { fetchStoreUser, resolveStoreUser } from "./store-frame";

vi.mock("@/lib/fetcher", () => ({ apiFetch: vi.fn() }));

describe("store session", () => {
  beforeEach(() => {
    vi.mocked(apiFetch).mockReset();
  });

  it("treats a 401 response as a guest without using apiFetch", async () => {
    const fetcher = vi.fn().mockResolvedValue(new Response(null, { status: 401 }));

    await expect(fetchStoreUser(fetcher)).resolves.toBeNull();
    expect(fetcher).toHaveBeenCalledWith("/api/auth/me");
    expect(apiFetch).not.toHaveBeenCalled();
    expect(resolveStoreUser(401, { name: "Khách hàng" })).toBeNull();
  });

  it("uses the name returned by the session endpoint", async () => {
    const fetcher = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ name: "Người dùng API" }), {
        status: 200,
        headers: { "content-type": "application/json" },
      })
    );

    await expect(fetchStoreUser(fetcher)).resolves.toEqual({ name: "Người dùng API" });
    expect(resolveStoreUser(200, { name: "Người dùng API" })).toEqual({ name: "Người dùng API" });
  });

  it("treats fetch failures as a guest", async () => {
    await expect(fetchStoreUser(vi.fn().mockRejectedValue(new Error("network failure")))).resolves.toBeNull();
  });
});
