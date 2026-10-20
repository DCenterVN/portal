import type { UserProfile } from "@/lib/auth/client";
import { existsSync } from "node:fs";
import { CONSOLE_NAV, consoleNavFor, consoleRouteAllowed } from "./console-nav";
import { describe, expect, it, vi } from "vitest";
import { fetchConsoleSession, resolveConsoleSession } from "./console-frame";

const profile: UserProfile & { avatar_key: string | null; avatar_url: string | null } = {
  id: "user-1", email: "dawn@example.com", phone: "", display_name: "Dawn", status: "ACTIVE",
  created_at: "2026-01-01T00:00:00Z", memberships: [], avatar_key: null, avatar_url: null,
};

describe("console session", () => {
  it("uses the active API branch and real profile", () => {
    expect(resolveConsoleSession(
      profile,
      {
        active_context: { branch_id: "branch-2" },
        contexts: [
          { branch_id: "branch-1", branch_name: "Chi nhánh 1", org_name: "Công ty" },
          { branch_id: "branch-2", branch_name: "Chi nhánh 2", org_name: "Công ty" },
        ],
      },
    )).toEqual({
      user: { name: "Dawn", detail: "dawn@example.com" },
      context: { label: "Chi nhánh 2", sublabel: "Công ty" },
      permissions: [],
    });
  });

  it("loads profile and context endpoints", async () => {
    const fetcher = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify(profile), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ active_context: {}, contexts: [] }), { status: 200 }));

    await expect(fetchConsoleSession(fetcher)).resolves.toEqual({
      user: { name: "Dawn", detail: profile.email },
      context: { label: "Chưa chọn chi nhánh", sublabel: undefined },
      permissions: [],
    });
    expect(fetcher).toHaveBeenNthCalledWith(1, "/api/auth/me");
    expect(fetcher).toHaveBeenNthCalledWith(2, "/api/auth/context");
  });

  it("reports network failures as errors", async () => {
    await expect(fetchConsoleSession(vi.fn().mockRejectedValue(new Error("offline")))).resolves.toEqual({
      user: { name: "Tài khoản" },
      context: { label: "Chưa chọn chi nhánh" },
      error: "Không tải được phiên làm việc.",
    });
  });
});


describe("console failure distinctions and navigation", () => {
  it.each(["profile", "context"])("marks a %s 401 as signed out", async (endpoint) => {
    const fetcher = vi.fn<typeof fetch>((url) => Promise.resolve(new Response(
      JSON.stringify(String(url).endsWith("me") ? profile : { contexts: [] }),
      { status: String(url).endsWith(endpoint === "profile" ? "me" : "context") ? 401 : 200 },
    )));
    expect((await fetchConsoleSession(fetcher)).user.name).toBe("Đăng nhập");
  });

  it.each(["5xx", "network", "bad JSON"])("keeps the profile when context has %s", async (kind) => {
    const fetcher = vi.fn<typeof fetch>((url) => {
      if (String(url).endsWith("me")) return Promise.resolve(new Response(JSON.stringify(profile)));
      if (kind === "network") return Promise.reject(new Error("offline"));
      return Promise.resolve(new Response("invalid", { status: kind === "5xx" ? 503 : 200 }));
    });
    const session = await fetchConsoleSession(fetcher);
    expect(session.user).toEqual({ name: "Dawn", detail: "dawn@example.com" });
    expect(session).toHaveProperty("error", "Không tải được phạm vi chi nhánh.");
  });

  it.each([503, 200])("reports profile HTTP %s or malformed JSON as an error", async (status) => {
    const fetcher = vi.fn<typeof fetch>((url) => Promise.resolve(new Response(
      String(url).endsWith("me") ? "invalid" : JSON.stringify({ contexts: [] }), { status: String(url).endsWith("me") ? status : 200 },
    )));
    expect(await fetchConsoleSession(fetcher)).toHaveProperty("error", "Không tải được phiên làm việc.");
  });

  it("TC-5: every console nav href has a page", () => {
    for (const item of CONSOLE_NAV.flatMap((group) => group.items)) {
      expect(existsSync(`app/(console)${item.href}/page.tsx`), item.href).toBe(true);
    }
  });

  it("filters nav by permissions and drops empty groups", () => {
    expect(consoleNavFor(new Set()).map((group) => group.title)).toEqual(["Tổng quan"]);
    const nav = consoleNavFor(new Set(["production:order:read"]));
    expect(nav.flatMap((group) => group.items.map((item) => item.href))).toEqual(["/console", "/production/orders"]);
  });

  it("exposes branches, memberships and roles in console navigation", () => {
    expect(CONSOLE_NAV.flatMap((group) => group.items.map((item) => item.href))).toEqual(expect.arrayContaining(["/branches", "/memberships", "/roles"]));
  });
});

it("accepts an empty display name without losing email or reporting a profile error", async () => {
  const unnamed: UserProfile = { ...profile, display_name: "" };
  const fetcher = vi.fn<typeof fetch>((url) => Promise.resolve(new Response(JSON.stringify(
    String(url).endsWith("me") ? unnamed : { active_context: {}, contexts: [] },
  ), { status: 200 })));
  const session = await fetchConsoleSession(fetcher);
  expect(session.user).toEqual({ name: unnamed.email, detail: unnamed.email });
  expect(session).not.toHaveProperty("error");
});

it.each(["5xx", "network", "bad JSON"])("keeps an unnamed profile and email when context has %s", async (kind) => {
  const unnamed: UserProfile = { ...profile, display_name: "" };
  const fetcher = vi.fn<typeof fetch>((url) => {
    if (String(url).endsWith("me")) return Promise.resolve(new Response(JSON.stringify(unnamed)));
    if (kind === "network") return Promise.reject(new Error("offline"));
    return Promise.resolve(new Response("invalid", { status: kind === "5xx" ? 503 : 200 }));
  });
  const session = await fetchConsoleSession(fetcher);
  expect(session.user).toEqual({ name: unnamed.email, detail: unnamed.email });
  expect(session.error).toBe("Không tải được phạm vi chi nhánh.");
});


it("uses org effective permissions instead of auth context role names or cached permissions", async () => {
  const fetcher = vi.fn()
    .mockResolvedValueOnce(new Response(JSON.stringify(profile)))
    .mockResolvedValueOnce(new Response(JSON.stringify({ active_context: { org_id: "org", branch_id: "main" }, contexts: [], permissions: ["*"], roles: ["ADMIN"] })))
    .mockResolvedValueOnce(new Response(JSON.stringify({ action_keys: ["org:membership:read"] })));
  const session = await fetchConsoleSession(fetcher);
  expect(fetcher).toHaveBeenNthCalledWith(3, "/api/org/permissions/me?org_id=org&branch_id=main");
  expect(session.permissions).toEqual(["org:membership:read"]);
});
it.each([403, 503, 200])("fails closed when permission lookup returns %s or malformed data", async (status) => {
  const fetcher = vi.fn()
    .mockResolvedValueOnce(new Response(JSON.stringify(profile)))
    .mockResolvedValueOnce(new Response(JSON.stringify({ active_context: { org_id: "org", branch_id: "main" }, permissions: ["org:membership:read"] })))
    .mockResolvedValueOnce(new Response(JSON.stringify({ actions: ["org:membership:read"] }), { status }));
  const session = await fetchConsoleSession(fetcher);
  expect(session.error).toBeTruthy();
  expect(session.permissions).toEqual([]);
});
it("gates membership routes and SALES menu with effective action keys", () => {
  expect(consoleRouteAllowed("/memberships", new Set())).toBe(false);
  expect(consoleRouteAllowed("/memberships/detail", new Set(["org:membership:read"]))).toBe(true);
  expect(consoleNavFor(new Set(["ADMIN"])).flatMap((group) => group.items).some((item) => item.href === "/memberships")).toBe(false);
  expect(consoleNavFor(new Set(["sales:price_book:create"])).flatMap((group) => group.items).some((item) => item.href === "/sales/pricing")).toBe(true);
});
