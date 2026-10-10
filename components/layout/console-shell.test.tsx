import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { ThemeProvider } from "@/components/theme-provider";
import { ConsoleHeader } from "./console-header";
import { ConsoleShell, initialCollapsed, isActive, type ShellNavGroup } from "./console-shell";

vi.mock("next/navigation", () => ({ usePathname: () => "/inventory/shelves", useRouter: () => ({ push: vi.fn() }) }));

// Node has no DOM: with `open` set, every `useState(false)` starts true so the account menu shows in the SSR markup.
const flags = vi.hoisted(() => ({ open: false }));
vi.mock("react", async (original) => {
  const actual = await original<typeof import("react")>();
  return { ...actual, useState: (initial: unknown) => actual.useState(flags.open && initial === false ? true : initial) };
});

const themed = (node: React.ReactNode) => renderToStaticMarkup(<ThemeProvider>{node}</ThemeProvider>);
const section = (html: string, tag: string) => html.slice(html.indexOf(`<${tag}`), html.indexOf(`</${tag}>`));

const nav: ShellNavGroup[] = [
  {
    title: "Inventory",
    items: [
      { href: "/inventory/shelves", label: "Shelves", match: "/inventory/shelves" },
      { href: "/production/orders", label: "Orders", match: "/production/orders" },
    ],
  },
];

describe("ConsoleShell", () => {
  it("initializes collapsed state from storage before viewport width", () => {
    expect(initialCollapsed(1200, "1")).toBe(true);
    expect(initialCollapsed(700, "0")).toBe(false);
    expect(initialCollapsed(1024, null)).toBe(false);
    expect(initialCollapsed(1023, null)).toBe(true);
  });

  it("matches exact routes and descendants only", () => {
    expect(isActive("/inventory/shelves", "/inventory/shelves")).toBe(true);
    expect(isActive("/inventory/shelves/one", "/inventory/shelves")).toBe(true);
    expect(isActive("/inventory/shelving", "/inventory/shelves")).toBe(false);
  });

  it("renders the CRM shell, active link, toggle, and skip link", () => {
    const html = themed(
      <ConsoleShell nav={nav} context={{ label: "Branch" }} user={{ name: "User" }}>
        <p>Page content</p>
      </ConsoleShell>
    );

    expect(html).toContain('data-surface="console"');
    expect(html).not.toContain('data-collapsed="true"');
    expect((html.match(/<main\b/g) ?? []).length).toBe(1);
    expect(html).toContain('<main id="main"');
    expect(html).toContain('aria-expanded="true"');
    expect(html).toContain('aria-current="page"');
    expect(html).toContain('href="#main">Bỏ qua tới nội dung</a>');
  });

  it("renders the requested initial collapsed state", () => {
    const html = themed(
      <ConsoleShell
        nav={nav}
        context={{ label: "Branch" }}
        user={{ name: "User" }}
        defaultCollapsed
      >
        <p>Page content</p>
      </ConsoleShell>
    );

    expect(html).toContain('data-surface="console" data-collapsed="true"');
    expect(html).toContain('aria-expanded="false"');
  });

  it("keeps the sidebar solid with no avatar and the main area full width", () => {
    const html = themed(
      <ConsoleShell nav={nav} context={{ label: "Branch" }} user={{ name: "Dawn Nguyen", detail: "Quản lý" }}>
        <p>Page content</p>
      </ConsoleShell>
    );
    const aside = section(html, "aside");
    expect(aside).toContain("bg-[var(--color-surface)]");
    expect(aside).not.toMatch(/glass|backdrop-blur/);
    expect(aside).not.toContain("Dawn Nguyen");
    expect(aside).not.toContain("rounded-full");
    expect(html.match(/<main\b[^>]*>/)?.[0]).not.toMatch(/max-w|mx-auto/);
  });

  it("puts a sticky glass L2 top bar with theme toggle and avatar menu", () => {
    const html = themed(
      <ConsoleShell nav={nav} context={{ label: "Branch" }} user={{ name: "Dawn Nguyen" }}>
        <p>Page content</p>
      </ConsoleShell>
    );
    const header = section(html, "header");
    expect(header.match(/<header[^>]*class="([^"]*)"/)?.[1].split(" ")).toEqual(expect.arrayContaining(["sticky", "top-0", "border-glass-edge"]));
    const glass = header.match(/<span aria-hidden="true" class="([^"]*)"/)?.[1] ?? "";
    for (const name of ["absolute", "inset-0", "bg-glass-l2", "glass-blur-l2"]) expect(glass).toContain(name);
    expect(header).toMatch(/aria-label="Chuyển sang giao diện (tối|sáng)"/);
    expect(header).toContain('aria-label="Tài khoản của Dawn Nguyen" aria-haspopup="menu"');
  });

  it("lists Tài khoản and Đăng xuất in the open avatar menu", () => {
    flags.open = true;
    try {
      const html = themed(
        <ConsoleHeader collapsed={false} onToggle={() => {}} toggleLabel="Toggle" user={{ name: "Dawn" }} onLogout={() => {}} />
      );
      const items = [...html.matchAll(/role="menuitem"[^>]*>(?:<svg[\s\S]*?<\/svg>)?([^<]*)/g)].map((match) => match[1]);
      expect(items).toEqual(["Tài khoản", "Đăng xuất"]);
    } finally {
      flags.open = false;
    }
  });
});
