import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { ConsoleShell, initialCollapsed, isActive, type ShellNavGroup } from "./console-shell";

vi.mock("next/navigation", () => ({ usePathname: () => "/inventory/shelves" }));

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
    const html = renderToStaticMarkup(
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
    const html = renderToStaticMarkup(
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
});
