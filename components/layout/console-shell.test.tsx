import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { ThemeProvider } from "@/components/theme-provider";
import type { NavGroup } from "@/lib/navigation";
import { SidebarProvider } from "@/components/ui/sidebar";
import { ConsoleHeader } from "./console-header";
import { ConsoleShell } from "./console-shell";

vi.mock("next/navigation", () => ({ usePathname: () => "/inventory/shelves", useRouter: () => ({ push: vi.fn() }) }));

// Node has no DOM: with `open` set, the account menu content renders inline so its items show in the SSR markup.
const flags = vi.hoisted(() => ({ open: false }));

vi.mock("@/components/ui/dropdown-menu", async (original) => {
  const { ssrMenuContent, ssrMenuItem } = await import("@/mocks/overlay-ssr");
  return { ...(await original<typeof import("@/components/ui/dropdown-menu")>()), DropdownMenuContent: ssrMenuContent(() => flags.open), DropdownMenuItem: ssrMenuItem };
});

const themed = (node: React.ReactNode) => renderToStaticMarkup(<ThemeProvider>{node}</ThemeProvider>);
const section = (html: string, tag: string) => html.slice(html.indexOf(`<${tag}`), html.indexOf(`</${tag}>`));

const nav: NavGroup[] = [
  {
    title: "Kho",
    items: [
      { href: "/inventory/shelves", label: "Kệ hàng", match: "/inventory/shelves" },
      { href: "/production/orders", label: "Lệnh sản xuất", match: "/production/orders" },
    ],
  },
];

const shell = (props: Partial<React.ComponentProps<typeof ConsoleShell>> = {}) =>
  themed(
    <ConsoleShell nav={nav} context={{ label: "Chi nhánh 1", sublabel: "Công ty" }} user={{ name: "Dawn Nguyen", detail: "Quản lý" }} {...props}>
      <p>Page content</p>
    </ConsoleShell>
  );

describe("ConsoleShell", () => {
  it("renders one main landmark, the skip link and the labelled navigation with the active link", () => {
    const html = shell();
    expect(html).toContain('data-surface="console"');
    expect((html.match(/<main\b/g) ?? []).length).toBe(1);
    expect(html).toContain('<main id="main"');
    expect(html).toContain('href="#main">Bỏ qua tới nội dung</a>');
    expect(html).toMatch(/<nav aria-label="Điều hướng quản trị"/);
    const current = html.match(/<a\b[^>]*aria-current="page"[^>]*>/g) ?? [];
    expect(current).toHaveLength(1);
    expect(current[0]).toContain('href="/inventory/shelves"');
    expect(html.match(/<main\b[^>]*>/)?.[0]).not.toMatch(/max-w|mx-auto/);
  });

  it("is a shadcn icon-collapsible sidebar with a rail, group menu and the branch context", () => {
    const html = shell();
    expect(html).toContain('data-slot="sidebar-wrapper"');
    expect(html).toContain('data-state="expanded"');
    expect(html).toContain('data-slot="sidebar-rail"');
    expect(html).toContain(">Kho<");
    expect(html).toContain("Chi nhánh 1");
    expect(html).toContain("Công ty");
    expect(html).not.toMatch(/glass|backdrop-blur/);
  });

  it("puts the breadcrumb (group > page) and the sidebar trigger in a sticky header", () => {
    const header = section(shell(), "header");
    expect(header.match(/<header[^>]*class="([^"]*)"/)?.[1].split(" ")).toEqual(expect.arrayContaining(["sticky", "top-0", "border-b"]));
    expect(header).toContain('aria-label="breadcrumb"');
    expect(header).toContain(">Kho</li>");
    expect(header).toMatch(/aria-current="page"[^>]*>Kệ hàng<\/span>/);
    expect(header).toContain('data-sidebar="trigger"');
    expect(header).toMatch(/aria-label="Chuyển sang giao diện (tối|sáng)"/);
  });

  it("keeps header icon buttons at a 44px touch size on mobile", () => {
    const header = section(shell(), "header");
    const triggerClasses = header.match(/<button[^>]*data-sidebar="trigger"[^>]*class="([^"]*)"/)?.[1] ?? header.match(/<button[^>]*class="([^"]*)"[^>]*data-sidebar="trigger"/)?.[1] ?? "";
    expect(triggerClasses).toContain("max-md:size-11");
    expect(header.match(/<button[^>]*aria-label="Chuyển sang giao diện[^>]*>/)?.[0]).toContain("max-md:size-11");
  });

  it("omits the breadcrumb when the path matches no menu item", () => {
    const html = themed(<SidebarProvider><ConsoleHeader crumbs={[]} /></SidebarProvider>);
    expect(html).not.toContain('aria-label="breadcrumb"');
  });

  it("shows the status footer only when given", () => {
    expect(shell()).not.toContain("<footer");
    expect(shell({ statusText: "Đồng bộ" })).toContain("Đồng bộ");
  });

  it("names the account trigger and keeps name and detail in the sidebar footer", () => {
    const html = shell();
    const footer = html.slice(html.indexOf('data-slot="sidebar-footer"'));
    expect(footer).toContain('aria-label="Tài khoản của Dawn Nguyen"');
    expect(footer).toContain("Dawn Nguyen");
    expect(footer).toContain("Quản lý");
    expect(footer).toContain("aria-haspopup=\"menu\"");
  });

  it("lists Tài khoản and Đăng xuất in the open account menu, and Đăng xuất only with a logout handler", () => {
    flags.open = true;
    try {
      const items = (html: string) => [...html.matchAll(/role="menuitem"[^>]*>(?:<svg[\s\S]*?<\/svg>)?([^<]*)/g)].map((match) => match[1]);
      expect(items(shell({ onLogout: () => {} }))).toEqual(["Tài khoản", "Đăng xuất"]);
      expect(items(shell())).toEqual(["Tài khoản"]);
    } finally {
      flags.open = false;
    }
  });
});
