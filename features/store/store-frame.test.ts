import { beforeEach, describe, expect, it, vi } from "vitest";
import type { UserProfile } from "@/lib/auth/client";
import { apiFetch } from "@/lib/fetcher";
import { fetchStoreUser, resolveStoreUser } from "./store-frame";

vi.mock("@/lib/fetcher", () => ({ apiFetch: vi.fn() }));

const profile: UserProfile & { avatar_key: string | null; avatar_url: string | null } = { id: "user-1", email: "user@example.com", phone: "", display_name: "Người dùng API", status: "ACTIVE", created_at: "2026-01-01T00:00:00Z", memberships: [], avatar_key: null, avatar_url: null };

describe("store session", () => {
  beforeEach(() => {
    vi.mocked(apiFetch).mockReset();
  });

  it("treats a 401 response as a guest without using apiFetch", async () => {
    const fetcher = vi.fn().mockResolvedValue(new Response(null, { status: 401 }));

    await expect(fetchStoreUser(fetcher)).resolves.toBeNull();
    expect(fetcher).toHaveBeenCalledWith("/api/auth/me");
    expect(apiFetch).not.toHaveBeenCalled();
    expect(resolveStoreUser(401, profile)).toBeNull();
  });

  it("uses the name returned by the session endpoint", async () => {
    const fetcher = vi.fn().mockResolvedValue(
      new Response(JSON.stringify(profile), {
        status: 200,
        headers: { "content-type": "application/json" },
      })
    );

    await expect(fetchStoreUser(fetcher)).resolves.toEqual({ name: "Người dùng API" });
    expect(resolveStoreUser(200, profile)).toEqual({ name: "Người dùng API" });
  });

  it("accepts an empty display name and uses the profile email as the account label", async () => {
    const unnamed: UserProfile = { ...profile, display_name: "" };
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(new Response(JSON.stringify(unnamed), { status: 200 }));
    await expect(fetchStoreUser(fetcher)).resolves.toEqual({ name: unnamed.email });
    expect(resolveStoreUser(200, unnamed)).toEqual({ name: unnamed.email });
  });

  it.each([
    ["5xx", () => Promise.resolve(new Response("unavailable", { status: 503 }))],
    ["network", () => Promise.reject(new Error("offline"))],
    ["bad JSON", () => Promise.resolve(new Response("invalid", { status: 200 }))],
  ])("rejects %s instead of presenting a guest", async (_kind, fetcher) => {
    await expect(fetchStoreUser(vi.fn(fetcher))).rejects.toThrow();
  });
});
