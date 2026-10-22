import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import type { UserProfile } from "@/lib/auth/client";
import { existsSync } from "node:fs";
import { CONSOLE_NAV, consoleNavFor, consoleRouteAllowed } from "./console-nav";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ConsoleFrame, fetchConsoleSession, resolveConsoleSession } from "./console-frame";

const profile: UserProfile & { avatar_key: string | null; avatar_url: string | null } = {
  id: "user-1", email: "dawn@example.com", phone: "", display_name: "Dawn", status: "ACTIVE",
  created_at: "2026-01-01T00:00:00Z", memberships: [], avatar_key: null, avatar_url: null,
};

const contextPayload = { user: profile, active_context: {}, contexts: [] };

describe("console session", () => {
  it("uses the active API branch and real profile", () => {
    expect(resolveConsoleSession(profile, {
      active_context: { branch_id: "branch-2" },
      contexts: [
        { branch_id: "branch-1", branch_name: "Chi nhánh 1", org_name: "Công ty" },
        { branch_id: "branch-2", branch_name: "Chi nhánh 2", org_name: "Công ty" },
      ],
    })).toEqual({
      user: { name: "Dawn", detail: profile.email },
      context: { label: "Chi nhánh 2", sublabel: "Công ty" }, permissions: [],
    });
  });

  it("loads profile from context without a separate profile request", async () => {
    const fetcher = vi.fn().mockResolvedValueOnce(new Response(JSON.stringify(contextPayload)));
    await expect(fetchConsoleSession(fetcher)).resolves.toEqual({
      user: { name: "Dawn", detail: profile.email },
      context: { label: "Chưa chọn chi nhánh", sublabel: undefined }, permissions: [],
    });
    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(fetcher).toHaveBeenCalledWith("/api/auth/context");
  });

  it.each(["network", "bad JSON", "missing user", "invalid profile", "auth 503"])("reports %s as a session error", async (kind) => {
    const fetcher = kind === "network" ? vi.fn().mockRejectedValue(new Error("offline"))
      : vi.fn().mockResolvedValueOnce(new Response(
        kind === "bad JSON" ? "invalid" : JSON.stringify(kind === "missing user" ? {} : { user: {} }),
        { status: kind === "auth 503" ? 503 : 200 },
      ));
    expect(await fetchConsoleSession(fetcher)).toEqual({
      user: { name: "Tài khoản" }, context: { label: "Chưa chọn chi nhánh" }, error: "Không tải được phiên làm việc.",
    });
  });

  it("marks a propagated 401 as signed out", async () => {
    const fetcher = vi.fn().mockResolvedValueOnce(new Response(null, { status: 401 }));
    expect((await fetchConsoleSession(fetcher)).user.name).toBe("Đăng nhập");
  });

  it.each(["Dawn", ""])("keeps profile %s when BFF reports an org failure", async (name) => {
    const fetcher = vi.fn().mockResolvedValueOnce(new Response(JSON.stringify({ user: { ...profile, display_name: name }, error: "org_context_unavailable" }), { status: 503 }));
    const session = await fetchConsoleSession(fetcher);
    expect(session.user).toEqual({ name: name || profile.email, detail: profile.email });
    expect(session.error).toBe("Không tải được phạm vi chi nhánh.");
  });

  it("accepts an empty display name and uses the email", async () => {
    const fetcher = vi.fn().mockResolvedValueOnce(new Response(JSON.stringify({ ...contextPayload, user: { ...profile, display_name: "" } })));
    const session = await fetchConsoleSession(fetcher);
    expect(session.user).toEqual({ name: profile.email, detail: profile.email });
    expect(session.error).toBeUndefined();
  });
});

describe("console effective permissions and navigation", () => {
  it("uses org effective permissions rather than context role names or cached permissions", async () => {
    const fetcher = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ ...contextPayload, active_context: { org_id: "org", branch_id: "main" }, permissions: ["*"], roles: ["ADMIN"] })))
      .mockResolvedValueOnce(new Response(JSON.stringify({ action_keys: ["org:membership:read"] })));
    const session = await fetchConsoleSession(fetcher);
    expect(fetcher).toHaveBeenNthCalledWith(2, "/api/org/permissions/me?org_id=org&branch_id=main");
    expect(session.permissions).toEqual(["org:membership:read"]);
  });

  it.each([403, 503, 200])("fails closed when permission lookup returns %s or malformed data", async (status) => {
    const fetcher = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ ...contextPayload, active_context: { org_id: "org", branch_id: "main" }, permissions: ["org:membership:read"] })))
      .mockResolvedValueOnce(new Response(JSON.stringify({ actions: ["org:membership:read"] }), { status }));
    const session = await fetchConsoleSession(fetcher);
    expect(session.error).toBeTruthy();
    expect(session.permissions).toEqual([]);
  });

  it("every console nav href has a page", () => {
    for (const item of CONSOLE_NAV.flatMap((group) => group.items)) {
      expect(existsSync(`app/(console)${item.href}/page.tsx`), item.href).toBe(true);
    }
  });
  it("filters nav by permissions and drops empty groups", () => {
    expect(consoleNavFor(new Set()).map((group) => group.title)).toEqual(["Tổng quan"]);
    expect(consoleNavFor(new Set(["production:order:read"])).flatMap((group) => group.items.map((item) => item.href))).toEqual(["/console", "/production/orders"]);
  });
  it("exposes branches, memberships and roles", () => {
    expect(CONSOLE_NAV.flatMap((group) => group.items.map((item) => item.href))).toEqual(expect.arrayContaining(["/branches", "/memberships", "/roles"]));
  });
  it("gates membership routes and SALES menu with effective action keys", () => {
    expect(consoleRouteAllowed("/memberships", new Set())).toBe(false);
    expect(consoleRouteAllowed("/memberships/detail", new Set(["org:membership:read"]))).toBe(true);
    expect(consoleNavFor(new Set(["ADMIN"])).flatMap((group) => group.items).some((item) => item.href === "/memberships")).toBe(false);
    expect(consoleNavFor(new Set(["sales:price_book:create"])).flatMap((group) => group.items).some((item) => item.href === "/sales/pricing")).toBe(true);
  });
});

const frameState: { current?: ReturnType<typeof resolveConsoleSession> } = vi.hoisted(() => ({}));
vi.mock("react", async (importOriginal) => {
  const actual = await importOriginal<typeof React>();
  return { ...actual, useState: (initial: unknown) => actual.useState(frameState.current ?? initial) };
});
vi.mock("next/navigation", () => ({ usePathname: () => "/memberships" }));
vi.mock("@/components/ui/toast", () => ({ useToast: () => ({ toast: { error: vi.fn() } }) }));
vi.mock("@/components/layout/console-shell", () => ({
  ConsoleShell: ({ children }: { children: React.ReactNode }) => children,
}));
vi.mock("next-intl", () => ({ NextIntlClientProvider: ({ children }: { children: React.ReactNode }) => children }));
afterEach(() => { delete frameState.current; });

describe("console content authorization", () => {
  it.each([
    { name: "loading", permissions: undefined, error: undefined, visible: false, marker: 'aria-busy="true"' },
    { name: "allowed", permissions: ["org:membership:read"], error: undefined, visible: true, marker: "Protected content" },
    { name: "denied", permissions: [], error: undefined, visible: false, marker: "Không có quyền truy cập" },
    { name: "error", permissions: ["org:membership:read"], error: "Không tải được quyền", visible: false, marker: "Không tải được quyền" },
  ])("$name never mounts protected content without verified permission", ({ permissions, error, visible, marker }) => {
    frameState.current = { user: { name: "Dawn" }, context: { label: "Chi nhánh" }, permissions, error };
    const child = vi.fn(() => React.createElement("p", null, "Protected content"));
    const html = renderToStaticMarkup(React.createElement(ConsoleFrame, { children: React.createElement(child) }));
    expect(child).toHaveBeenCalledTimes(visible ? 1 : 0);
    expect(html).toContain(marker);
    if (!visible) expect(html).not.toContain("Protected content");
  });
});

describe("console BFF request count", () => {
  it("opens the console with exactly one upstream auth/me call", async () => {
    const { GET: contextGET } = await import("@/app/api/auth/context/route");
    const { GET: meGET } = await import("@/app/api/auth/me/route");
    const { NextRequest } = await import("next/server");
    let profileCalls = 0;
    const upstream = vi.fn<typeof fetch>(async (url) => {
      const path = new URL(String(url)).pathname;
      if (path === "/auth/me") {
        profileCalls++;
        return new Response(JSON.stringify(profile));
      }
      if (path === "/org/access-contexts/me") return new Response(JSON.stringify([
        { org_id: "org", org_name: "Công ty", branch_id: "main", branch_name: "Chi nhánh chính", roles: [] },
      ]));
      if (path === "/org/permissions/me") return new Response(JSON.stringify({ action_keys: ["org:membership:read"] }));
      throw new Error("Unexpected upstream path");
    });
    vi.stubGlobal("fetch", upstream);
    try {
      const browser = vi.fn<typeof fetch>(async (url) => {
        const path = String(url);
        const request = new NextRequest(`http://portal${path}`, { headers: { cookie: "access_token=opaque-test-credential" } });
        if (path === "/api/auth/context") return contextGET(request);
        if (path === "/api/auth/me") return meGET(request);
        if (path.startsWith("/api/org/permissions/me?")) return new Response(JSON.stringify({ action_keys: ["org:membership:read"] }));
        throw new Error("Unexpected browser path");
      });
      const session = await fetchConsoleSession(browser);
      expect(session.user).toEqual({ name: "Dawn", detail: profile.email });
      expect(session.context).toEqual({ label: "Chi nhánh chính", sublabel: "Công ty" });
      expect(session.permissions).toEqual(["org:membership:read"]);
      expect(profileCalls).toBe(1);
      expect(browser.mock.calls.map(([url]) => String(url))).toEqual([
        "/api/auth/context", "/api/org/permissions/me?org_id=org&branch_id=main",
      ]);
    } finally { vi.unstubAllGlobals(); }
  });
});

describe("context BFF failure propagation", () => {
  it.each([
    { stage: "profile", status: 401, expectedUser: false },
    { stage: "profile", status: 503, expectedUser: false },
    { stage: "contexts", status: 401, expectedUser: true },
    { stage: "contexts", status: 503, expectedUser: true },
    { stage: "permissions", status: 503, expectedUser: true },
  ])("preserves $stage HTTP $status without another profile request", async ({ stage, status, expectedUser }) => {
    const { GET } = await import("@/app/api/auth/context/route");
    const { NextRequest } = await import("next/server");
    let profileCalls = 0;
    vi.stubGlobal("fetch", vi.fn<typeof fetch>(async (url) => {
      const path = new URL(String(url)).pathname;
      const current = path === "/auth/me" ? "profile" : path === "/org/access-contexts/me" ? "contexts" : "permissions";
      if (current === "profile") profileCalls++;
      if (current === stage) return new Response(JSON.stringify({ code: status, status: "error", message: "unavailable", errors: { error_code: status === 503 ? "UNAVAILABLE" : "UNAUTHORIZED" } }), { status });
      return new Response(JSON.stringify(current === "profile" ? profile : current === "contexts" ? [{ org_id: "org", branch_id: "main", branch_name: "Chi nhánh chính" }] : { action_keys: [] }));
    }));
    try {
      const response = await GET(new NextRequest("http://portal/api/auth/context", { headers: { cookie: "access_token=opaque-test-credential" } }));
      expect(response.status).toBe(status);
      const payload: unknown = await response.json();
      if (expectedUser) expect(payload).toHaveProperty("user", profile);
      else expect(payload).not.toHaveProperty("user");
      expect(profileCalls).toBe(1);
    } finally { vi.unstubAllGlobals(); }
  });
});
