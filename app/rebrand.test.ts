import { formatDateTime } from "@/lib/format-date";
import { readFileSync } from "node:fs";
import { describe, expect, it, vi } from "vitest";
import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { ConsoleSidebar } from "../components/layout/console-sidebar";
import { SidebarProvider } from "../components/ui/sidebar";
import { Input } from "../components/ui/input";
import { StatusBadge } from "../components/patterns/status-badge";
import { buttonVariants } from "../components/ui/button";
import { LoginForm } from "../features/customer-auth/login-form";
import { CustomerAuthShell } from "../components/layout/customer-auth-shell";
import { EmployeeAuthShell } from "../components/layout/employee-auth-shell";
import ProfileClient from "./(store)/me/profile-client";
import { StaffAccount } from "../features/account/staff/staff-account";
import { NextIntlClientProvider } from "next-intl";
import viMessages from "../messages/vi.json";
const StaffProfileView = () => React.createElement(StaffAccount);
import { SWRConfig, unstable_serialize } from "swr";
import { AccessProvider } from "../lib/access-boundary";
import type { Membership } from "../lib/api/platform-client";
import { BranchesView } from "../features/branches/branches-view";
import { MembershipsView } from "../features/memberships/memberships-view";
import { ThemeProvider } from "../components/theme-provider";
import { ShelvesView } from "../features/inventory/shelves-view";
import { OrdersView } from "../features/production/orders-view";
import { QCView } from "../features/production/qc-view";
import { TargetsView } from "../features/production/targets-view";
import { OrdersView as SalesOrdersView } from "../features/products/orders-view";
import { ProductCreateDialog } from "../features/products/product-create-dialog";
import { ProductDetailView } from "../features/products/product-detail-view";
import { ProductsView } from "../features/products/products-view";
import { TraceView } from "../features/traceability/trace-view";
import type { Product } from "../lib/api/sales";
import type { PublicTraceability } from "../lib/api/production";
import type { Order } from "../lib/api/sales";
import type { ProductionTarget, ProductionOrder, ShelfPlacement } from "../lib/api/production";
import { FetchError } from "../lib/fetcher";
import type { UserProfile } from "../lib/auth/client";

// SSR cannot mount a portal. Only expose its rendered tree; effects/keyboard are
// covered by the existing dialog behavior tests and the later browser audit.
const portalRender = vi.hoisted(() => ({
  recordTab: "info", mounted: false, states: [] as unknown[],
  filter: undefined as string | undefined,
  filterClicks: {} as Record<string, () => void>,
}));
vi.mock("@/components/ui/toast", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
// Radix mounts dialog content in a portal that SSR never renders: show it inline when open.
vi.mock("../components/ui/sheet", () => {
  const part = (tag: string) => ({ children, className }: { children?: React.ReactNode; className?: string }) => React.createElement(tag, { className }, children);
  return {
    Sheet: ({ open, children }: { open?: boolean; children?: React.ReactNode }) => open ? React.createElement(React.Fragment, null, children) : null,
    SheetContent: ({ children, className }: { children?: React.ReactNode; className?: string }) => React.createElement("div", { role: "dialog", className }, children),
    SheetHeader: part("header"), SheetTitle: part("h2"), SheetDescription: part("p"), SheetFooter: part("footer"),
  };
});
vi.mock("../components/ui/dialog", () => {
  const part = (tag: string) => ({ children, className }: { children?: React.ReactNode; className?: string }) => React.createElement(tag, { className }, children);
  return {
    Dialog: ({ open, children }: { open?: boolean; children?: React.ReactNode }) => open ? React.createElement(React.Fragment, null, children) : null,
    DialogContent: ({ children, className }: { children?: React.ReactNode; className?: string }) => React.createElement("div", { role: "dialog", className }, children),
    DialogHeader: part("header"), DialogTitle: part("h2"), DialogDescription: part("p"), DialogFooter: part("footer"),
  };
});
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }), usePathname: () => "/account", useSearchParams: () => new URLSearchParams(`tab=${portalRender.recordTab}`) }));
vi.mock("react", async (importOriginal) => {
  const actual = await importOriginal<typeof React>();
  return { ...actual, useState: (initial: unknown) => {
    const state = actual.useState(portalRender.states.length ? portalRender.states.shift() : portalRender.mounted && initial === false ? true : initial);
    if (initial === "ALL" && portalRender.filter !== undefined) {
      return [portalRender.filter, (filter: string) => { portalRender.filter = filter; }];
    }
    return state;
  } };
});
vi.mock("../components/ui/button", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../components/ui/button")>();
  return { ...actual, Button: React.forwardRef<HTMLButtonElement, React.ComponentProps<typeof actual.Button>>((props, ref) => {
    if (portalRender.filter !== undefined && props.onClick) {
      const name = renderToStaticMarkup(React.createElement(React.Fragment, null, props.children)).replace(/<[^>]*>/g, "").trim();
      portalRender.filterClicks[name] = () => props.onClick!({} as React.MouseEvent<HTMLButtonElement>);
    }
    return React.createElement(actual.Button, { ...props, ref });
  }) };
});
vi.mock("react-dom", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-dom")>();
  return { ...actual, createPortal: (children: React.ReactNode) => children };
});

const PRIMARY_FILL = /(?:^|[\s"])bg-primary(?=[\s"]|$)/;

function classesFor(html: string, tag: string, attribute = "") {
  const element = html.match(new RegExp(`<${tag}\\b[^>]*${attribute}[^>]*>`))?.[0];
  expect(element).toBeDefined();
  return element!.match(/class="([^"]*)"/)?.[1] ?? "";
}

describe("S3 rendered sidebar and controls", () => {
  it("uses sidebar roles and a focused Lá dịu selection", () => {
    const html = renderToStaticMarkup(React.createElement(SidebarProvider, null, React.createElement(ConsoleSidebar, {
      pathname: "/inventory/lots",
      nav: [{ title: "Vận hành", items: [
        { href: "/inventory", match: "/inventory", label: "Kho" },
        { href: "/orders", match: "/orders", label: "Đơn hàng" },
      ] }], context: { label: "Chi nhánh", sublabel: "Hà Nội" },
      user: { name: "Dawn", detail: "Nhân viên" },
    })));
    expect(classesFor(html, "div", 'data-slot="sidebar-inner"')).toContain("bg-sidebar");
    expect(html).toContain('data-collapsible=""');
    const active = classesFor(html, "a", 'aria-current="page"');
    expect(active).toContain("data-[active=true]:bg-sidebar-accent");
    expect(active).toContain("data-[active=true]:text-sidebar-accent-foreground");
    const links = html.match(/<a\b[^>]*>/g)!;
    expect(links).toHaveLength(2);
    for (const link of links) {
      expect(link).toContain("focus-visible:ring-2");
      expect(link).not.toMatch(/ring-\[|#[\da-f]{3,8}\b/i);
    }
    expect(html).toContain("text-muted-foreground");
    expect(html).not.toMatch(/color-chrome|color-sun|color-leaf|color-mix|text-\[color:white\]|#[\da-f]{3,8}\b/i);
  });

  it("renders a shadcn input with role border, radius, surface and visible focus", () => {
    const html = renderToStaticMarkup(React.createElement(Input, {
      type: "password", name: "password", autoComplete: "current-password", disabled: true, "aria-label": "Mật khẩu",
    }));
    const classes = classesFor(html, "input");
    for (const token of ["h-9", "border-input", "rounded-md", "bg-transparent", "focus-visible:ring-[3px]", "focus-visible:ring-ring/50"]) expect(classes).toContain(token);
    expect(classes).not.toMatch(/\bh-(?:10|11)\b/);
    expect(html).toContain('type="password"');
    expect(html).toContain('name="password"');
    expect(html).toContain('autoComplete="current-password"');
    expect(html).toContain('disabled=""');
  });
});

const css = readFileSync("app/globals.css", "utf8");
const generated = readFileSync("app/tokens.generated.css", "utf8");
const layout = readFileSync("app/layout.tsx", "utf8");
const roles = "bg surface tint ink muted primary primary-ink primary-hover leaf accent accent-ink accent-hover sun info danger warn-ink line input-border focus".split(" ");
const palette = {
  light: "#FFFFFF #FFFFFF #F4F4F5 #18181B #5F5F68 #2B7A52 #FFFFFF #236444 #2B7A52 #F4F4F5 #18181B #E4E4E7 #92400E #5F5F68 #B91C1C #92400E #E4E4E7 #8C8C96 #2B7A52",
  dark: "#09090B #101012 #18181B #FAFAFA #A1A1AA #4CAF7D #09090B #5BBF8A #4CAF7D #1F1F23 #FAFAFA #27272A #E8B04B #A1A1AA #F87171 #E8B04B #27272A #666670 #4CAF7D",
};
const legacy = Object.fromEntries(Object.entries(palette).map(([mode, values]) =>
  [mode, Object.fromEntries(roles.map((role, index) => [role, values.split(" ")[index]]))])) as Record<"light" | "dark", Record<string, string>>;
const declarations = (body: string) => Object.fromEntries([...body.matchAll(/--([\w-]+):\s*([^;]+);/g)].map((match) => [match[1], match[2]]));
const generatedBlocks = [...generated.matchAll(/\{([^{}]+)\}/g)].map((match) => declarations(match[1]));

describe("S2 root brand contract", () => {
  it.each([
    ["Inter", ["400", "500", "600"], "--font-body", '["vietnamese", "latin"]'],
    ["Geist_Mono", ["400", "500"], "--font-mono", '["latin"]'],
  ] as const)("loads %s with its subsets, explicit weights and swap", (font, weights, variable, subsets) => {
    expect(layout).toMatch(new RegExp(`import \\{[^}]*\\b${font}\\b[^}]*\\} from "next/font/google"`));
    const options = layout.match(new RegExp(`const (\\w+) = ${font}\\(\\{([\\s\\S]*?)\\}\\)`));
    expect(options).not.toBeNull();
    const config = options![2];
    expect(config.match(/subsets:\s*(\[[^\]]*\])/)?.[1]).toBe(subsets);
    expect(config.match(/weight:\s*(\[[^\]]*\])/)?.[1]).toBe(JSON.stringify(weights).replaceAll(",", ", "));
    expect(config).toContain(`variable: "${variable}"`);
    expect(config).toContain('display: "swap"');
    expect(layout).toContain(`\${${options![1]}.variable}`);
    expect(layout).not.toMatch(/Quicksand/i);
  });

  it("uses solid primary for the default CTA with visible focus", () => {
    for (const variant of [undefined, "default"] as const) {
      const classes = buttonVariants({ variant });
      expect(classes).toContain("bg-primary");
      expect(classes).toContain("text-primary-foreground");
      expect(classes).toContain("hover:bg-primary/90");
      expect(classes).toContain("focus-visible:ring-[3px]");
      expect(classes).toContain("focus-visible:ring-ring/50");
      expect(classes).not.toMatch(/gradient|background-image|color-mix/);
    }
  });

  it("matches browser chrome and icon colours to the approved light/dark roles", () => {
    const manifest = JSON.parse(readFileSync("public/manifest.json", "utf8"));
    expect(manifest.theme_color).toBe(generatedBlocks[0]["color-primary"]);
    expect(manifest.theme_color).toBe(generatedBlocks[0].primary);
    expect(manifest.background_color).toBe(generatedBlocks[0]["color-bg"]);
    const icon = readFileSync("app/icon.svg", "utf8");
    expect(icon).toContain(`fill="${generatedBlocks[0]["color-primary"]}"`);
    expect(icon).toContain(`stroke="${generatedBlocks[0]["color-primary-ink"]}"`);
    for (const mode of ["light", "dark"] as const) {
      expect(layout).toContain(`{ media: "(prefers-color-scheme: ${mode})", color: "Canvas" }`);
    }
  });

  it("keeps identity while describing factual meal-kit preparation", () => {
    expect(layout).toContain('BRAND_NAME');
    expect(layout).toContain('siteName: BRAND_NAME');
    expect(layout).toContain("bộ nguyên liệu bữa ăn");
    expect(layout).not.toMatch(/hữu cơ|nông trại|VietGAP|GlobalGAP/);
  });
});

function contrast(foreground: string, background: string) {
  const luminance = (hex: string) => [1, 3, 5].reduce((sum, offset, index) => {
    const channel = parseInt(hex.slice(offset, offset + 2), 16) / 255;
    const linear = channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
    return sum + linear * [0.2126, 0.7152, 0.0722][index];
  }, 0);
  const [low, high] = [luminance(foreground), luminance(background)].sort((a, b) => a - b);
  return (high + 0.05) / (low + 0.05);
}

describe("S1 approved brand contract", () => {
  it.each([["light", 0], ["dark", 1]] as const)("keeps the legacy %s role names and exact approved colours that existing screens use", (mode, index) => {
    const colors = Object.fromEntries(Object.entries(generatedBlocks[index]).filter(([key]) => key.startsWith("color-")));
    expect(Object.keys(colors)).toEqual(roles.map((role) => `color-${role}`));
    roles.forEach((role) => expect(colors[`color-${role}`]).toBe(legacy[mode][role]));
  });

  it("keeps legacy elevations and radii, and points legacy font roles at the single loaded body font", () => {
    expect(generatedBlocks[0]).toMatchObject({
      "elevation-shadow-card": "0 1px 2px rgb(24 24 27 / .04)",
      "elevation-shadow-pop": "0 4px 12px rgb(24 24 27 / .08)",
      "radius-sm": "4px", "radius-md": "6px", "radius-lg": "8px", "radius-pill": "9999px",
    });
    expect(generatedBlocks[0]).toMatchObject({ "font-display": "var(--font-heading)", "font-sans": "var(--font-body)" });
    expect(css).toContain("--font-heading: var(--font-body);");
  });

  it("carries the legacy palette into the generated light, dark and automatic themes", () => {
    expect(generatedBlocks).toHaveLength(3);
    for (const [index, mode] of (["light", "dark", "dark"] as const).entries()) {
      const colors = Object.fromEntries(Object.entries(generatedBlocks[index]).filter(([key]) => key.startsWith("color-")));
      expect(colors).toEqual(Object.fromEntries(roles.map((role) => [`color-${role}`, legacy[mode][role]])));
    }
    expect(Object.keys(generatedBlocks[1])).toEqual(Object.keys(generatedBlocks[2]));
    expect(generated).toContain(':root, [data-theme="light"]');
    expect(generated).toContain('[data-theme="dark"], .dark');
    expect(generated).toContain('@media (prefers-color-scheme: dark)');
    expect(generated).toContain(':root:not([data-theme="light"])');
  });

  it.each(["light", "dark"] as const)("meets unrounded text and control contrast in %s", (mode) => {
    const colors = legacy[mode];
    const ratio = (fg: string, bg: string) => contrast(colors[fg], colors[bg]);
    for (const background of ["bg", "surface", "tint"]) {
      for (const foreground of ["ink", "muted", "danger", "warn-ink", mode === "light" ? "primary-hover" : "primary"]) expect(ratio(foreground, background)).toBeGreaterThanOrEqual(4.5);
      if (mode === "dark" || background !== "tint") expect(ratio("info", background)).toBeGreaterThanOrEqual(4.5);
      for (const control of ["input-border", "focus"]) expect(ratio(control, background)).toBeGreaterThanOrEqual(3);
    }
    for (const background of ["primary", "primary-hover", "danger"]) expect(ratio("primary-ink", background)).toBeGreaterThanOrEqual(4.5);
    for (const background of ["accent", "accent-hover"]) expect(ratio("accent-ink", background)).toBeGreaterThanOrEqual(4.5);
  });

  it("uses role aliases for semantic status, tags, destructive foreground and radius", () => {
    const aliases = { radius: "r-8" };
    for (const [alias, role] of Object.entries(aliases)) expect(css).toContain(`--${alias}: var(--${role});`);
    expect(generatedBlocks.map((block) => block["destructive-foreground"])).toEqual([legacy.light["primary-ink"], legacy.dark["primary-ink"], legacy.dark["primary-ink"]]);
    expect(css).not.toMatch(/#[\da-f]{3,8}\b|--land-(?:green|sage)|color-mix\([^;]*transparent/i);
    expect(css).not.toMatch(/--(?:l0|l1|l1-2|line|line-strong|fg|fg-2|fg-3|p|p-hover|p-text|p-soft|on-p|ok|warn|err)\s*:/);
    expect(generatedBlocks.filter((block) => "background" in block && "primary" in block && "chart-5" in block)).toHaveLength(3);
  });

  it.each([["light", 0], ["dark", 1]] as const)("meets AA contrast with the shadcn roles in %s", (mode, index) => {
    const colors = generatedBlocks[index];
    const ratio = (fg: string, bg: string) => contrast(colors[fg], colors[bg]);
    for (const background of ["background", "card", "muted"]) {
      for (const foreground of ["foreground", "muted-foreground", "accent-foreground", "success", "destructive"]) expect(ratio(foreground, background), `${foreground}/${background}`).toBeGreaterThanOrEqual(4.5);
      for (const control of ["input", "warning"]) expect(ratio(control, background), `${control}/${background}`).toBeGreaterThanOrEqual(3);
    }
    expect(contrast(colors["primary-foreground"], colors["primary-hover"]), "primary-foreground/primary-hover").toBeGreaterThanOrEqual(4.5);
    expect(contrast(colors["primary-foreground"], colors.primary), "primary-foreground/primary").toBeGreaterThanOrEqual(4.5);
    for (const [foreground, background] of [["accent-foreground", "accent"], ["success", "success-soft"], ["destructive", "destructive-soft"], ["warning", "warning-soft"]]) expect(ratio(foreground, background), `${foreground}/${background}`).toBeGreaterThanOrEqual(4.5);
  });

  it("keeps no landing or chrome leftovers, no component box-shadow, and the body font fallbacks", () => {
    expect(css).not.toMatch(/\.landing-|--land-|--color-chrome|landing-enter/);
    expect(css).not.toMatch(/box-shadow/);
    expect(css).toContain("font-family: var(--font-body);");
    expect(css).toContain("svg.lucide");
    expect(css).toContain("stroke-width: 1.75;");
    expect(css).not.toMatch(/quicksand|--font-nunito/i);
    expect(css).toContain("@import \"./tokens.generated.css\";");
  });
});


const rawDecoration = /(?:bg|text|border|ring|from|via|to|fill|stroke|shadow)-(?:green|emerald|teal|amber|rose|sky|white|black)(?:-\d+)?\b|#[\da-f]{3,8}\b|blur|glass|gradient/i;

function mountedMarkup(element: React.ReactNode) {
  portalRender.mounted = true;
  vi.stubGlobal("document", { body: {} });
  vi.stubGlobal("HTMLElement", class {});
  try {
    return renderToStaticMarkup(element);
  } finally {
    portalRender.mounted = false;
    vi.unstubAllGlobals();
  }
}

describe("S4 rendered semantic status and modal content", () => {
  it.each([
    ["success", "border-border", "text-foreground"],
    ["neutral", "border-border", "text-foreground"],
    ["warning", "bg-warning-soft", "text-warning"],
    ["danger", "bg-destructive-soft", "text-destructive"],
  ] as const)("renders %s status badge as a squared outline with readable text and no dot", (tone, surface, ink) => {
    const html = renderToStaticMarkup(React.createElement(StatusBadge, { tone, children: "Trạng thái" }));
    const classes = classesFor(html, "span");
    expect(classes).toContain(surface);
    expect(classes).toContain(ink);
    expect(classes).toContain("rounded-md");
    expect(classes).not.toContain("rounded-full");
    expect(html).not.toContain("aria-hidden");
    expect(html).toContain("Trạng thái");
    expect(html).not.toMatch(rawDecoration);
  });

});

// SSR state injection exposes client branches without changing production hooks.
function surfaceMarkup(element: React.ReactNode, states: unknown[] = []) {
  portalRender.states = [...states];
  try {
    return renderToStaticMarkup(element);
  } finally {
    portalRender.states = [];
  }
}

const profileFixture: UserProfile = {
  id: "user-42", email: "dawn@example.test", phone: "0901234567", display_name: "Dawn",
  status: "ACTIVE", created_at: "2026-09-29", memberships: [{ org_id: "org-1", org_name: "Bếp Hà Nội", roles: ["STAFF"] }],
};
function profileSurface(profile: UserProfile | null, staff = false, error?: FetchError) {
  const key = unstable_serialize(["/api/auth/me", undefined]);
  const provider = () => new Map(error ? [[key, { error, isLoading: false }]] : []);
  const fallback = profile ? { [key]: profile } : {};
  const element = React.createElement(staff ? StaffProfileView : ProfileClient);
  return React.createElement(NextIntlClientProvider, { locale: "vi", timeZone: "Asia/Ho_Chi_Minh", messages: viMessages, children: React.createElement(SWRConfig, { value: { provider, fallback, revalidateOnMount: false } }, element) });
}
const staffProfile = (profile: UserProfile) => profileSurface(profile, true);
const branchFixtures = [
  { id: "0192f3a4-5b6c-7d8e-9f00-112233445566", code: "MAIN", name: "Bếp trung tâm", type: "CENTRAL_KITCHEN", status: "ACTIVE", employee_count: 3 },
  { id: "0192f3a4-5b6c-7d8e-9f00-112233445567", code: "CAU-GIAY", name: "Cửa hàng Cầu Giấy", type: "STORE", status: "SUSPENDED", employee_count: 0 },
];
function branches() {
  return React.createElement(AccessProvider, { value: { plane: "company", root: "", actions: new Set(["org:branch:read", "org:branch:create"]) }, children:
    React.createElement(SWRConfig, { value: { provider: () => new Map(), revalidateOnMount: false, fallback: { "company-branches": branchFixtures } } }, React.createElement(BranchesView)) });
}
const membershipFixtures: Membership[] = (["ACTIVE", "SUSPENDED"] as const).map((status) => ({
  id: status, user_id: `user-${status}`, branch_id: "branch-1", role_codes: ["SALES"], status,
  display_name: `Nhân viên ${status}`, email: `${status.toLowerCase()}@example.test`, branch_name: "Bếp trung tâm", all_branches: false,
}));
function memberships(items: Membership[], actions = ["org:membership:read", "org:branch:read", "org:employee:create", "org:membership:update"]) {
  return React.createElement(AccessProvider, { value: { plane: "company", root: "", actions: new Set(actions) }, children:
    React.createElement(SWRConfig, { value: { provider: () => new Map(), revalidateOnMount: false,
      fallback: { "role-holders": items, "company-branches": branchFixtures },
    } }, React.createElement(MembershipsView)) });
}
const rawSurface = /(?:bg|text|border|ring|from|via|to|fill|stroke|shadow)-(?:slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose|white|black)(?:-\d+)?\b|#[\da-f]{3,8}\b|gradient|blur|glass/i;

function expectRoleSurface(html: string, rawOnly = false) {
  // This exact shared PageHeader icon wrapper belongs to a later slice. All
  // caller actions and content remain in the rendered scan, including inputs.
  // Frame L3 glass tokens (popover/EntityPicker listbox) are sanctioned; raw glass/blur stays banned.
  const owned = html.replace(/class="flex size-9 items-center justify-center rounded-xl bg-sky-500\/10 text-\[var\(--primary\)\] shrink-0 \[&amp;_svg\]:size-5"/g, "")
    .replace(/\b(?:border-glass-edge|bg-glass-l3|glass-blur-l3)\b/g, "")
    .replace(/\btext-white(?= hover:bg-destructive\/90)/g, "");
  expect(owned.match(rawSurface)?.[0] ?? null).toBeNull();
  if (rawOnly) return;
  expect(html).toMatch(/text-\[var\(--color-ink\)\]|text-foreground|text-muted-foreground|text-sm/);
  expect(html).toMatch(/bg-\[var\(--color-surface\)\]|bg-card|bg-background/);
  expect(html).toMatch(/border-\[var\(--color-line\)\]|\bborder\b/);
  for (const heading of html.match(/<h[1-4]\b[^>]*>/g) ?? []) {
    // h1–h3 inherit the root display role; h4 needs an explicit role.
    if (heading.startsWith("<h4")) expect(heading).not.toMatch(/font-\[family-name/);
    else expect(css).toMatch(/h1, h2, h3, \.font-serif\s*\{\s*font-family: var\(--font-body\)/);
  }
}

describe("S5 rendered auth, profile, branch and membership roles", () => {
  it("keeps customer login fields and solid role branding", () => {
    const html = surfaceMarkup(React.createElement(ThemeProvider, null, React.createElement(CustomerAuthShell, null, React.createElement(LoginForm))));
    expectRoleSurface(html);
    expect(html).toContain("bg-primary ");
    const labels = [...html.matchAll(/<label[^>]*for="([^"]+)"/g)].map(match => match[1]);
    expect(labels).toHaveLength(2);
    for (const id of labels) expect(html).toContain(`id="${id}"`);
    expect(html).toContain('type="password"');
    expect(html).toContain("Đăng ký");
    for (const input of html.match(/<input[^>]*type="(?:text|password)"[^>]*>/g)!) {
      expect(input).toContain("h-9");
      expect(input).not.toMatch(/\bh-(?:10|11)\b/);
    }
  });

  it("renders the customer account profile with inline fields and the side menu", () => {
    const html = surfaceMarkup(profileSurface(profileFixture));
    expectRoleSurface(html);
    for (const text of ["Dawn", "Tài khoản của tôi", "Hồ sơ", "Đơn hàng", "Ảnh đại diện", "Tên hiển thị", "Số điện thoại", "Email", "Lưu"]) expect(html).toContain(text);
    expect(html).toMatch(/<input\b[^>]*id="display_name-field"[^>]*value="Dawn"/);
    expect(html).toMatch(/<input\b[^>]*id="phone-field"[^>]*value="0901234567"/);
    expect(html).toMatch(/<button\b[^>]*type="submit"[^>]*disabled="">Lưu<\/button>/);
    expect(html).not.toMatch(/<button\b[^>]*>Sửa<\/button>/);
    expect(html).not.toContain("Mã NV");
    expect(html).not.toContain("Tổ chức và chi nhánh");
  });

  it("renders staff profile memberships with solid roles and original content", () => {
    const html = surfaceMarkup(staffProfile(profileFixture));
    expectRoleSurface(html, true);
    expect(html).toContain("Dawn");
    expect(html).toContain("Thông tin cá nhân");
    expect(html).toContain("Vai trò &amp; chi nhánh");
    expect(html).toContain("29/09/2026");
    portalRender.recordTab = "roles";
    try {
      expect(surfaceMarkup(staffProfile(profileFixture))).toContain("Bếp Hà Nội");
    } finally {
      portalRender.recordTab = "info";
    }
  });

  it.each([401, 500])("renders profile error %s with readable danger cue", (status) => {
    const html = surfaceMarkup(profileSurface(null, false, new FetchError("Lỗi kết nối", status, { error: status === 401 ? "UNAUTHORIZED" : "INTERNAL_ERROR" })));
    expectRoleSurface(html);
    expect(html).toContain("text-destructive");
    expect(html).toContain(status === 401 ? "Đăng nhập khách hàng" : "Thử lại");
  });

  it("keeps profile loading and empty memberships distinct", () => {
    const loading = surfaceMarkup(React.createElement(StaffProfileView));
    expect(loading).toContain("Đang tải tài khoản…");
    expect(loading).not.toMatch(rawSurface);
    portalRender.recordTab = "roles";
    try {
      const empty = surfaceMarkup(staffProfile({ ...profileFixture, memberships: [] }));
      expectRoleSurface(empty, true);
      expect(empty).toContain("Tài khoản chưa có phạm vi truy cập.");
    } finally {
      portalRender.recordTab = "info";
    }
  });

  it("renders the branch table with type, status and add button, without ids", () => {
    const html = surfaceMarkup(branches());
    expectRoleSurface(html);
    expect(html).toContain("Bếp trung tâm");
    expect(html).toContain("Cửa hàng");
    expect(html).toContain("Tạm ngừng");
    expect(html).toContain("Thêm cửa hàng");
    expect(html.replace(/href="[^"]*"/g, "")).not.toMatch(/[0-9a-f]{8}-[0-9a-f]{4}-/);
  });

  it.each([false, true])("renders membership table grouped by person (empty=%s)", (empty) => {
    const html = surfaceMarkup(memberships(empty ? [] : membershipFixtures));
    expectRoleSurface(html, true);
    expect(html).toContain("text-foreground");
    expect(html).toContain("Thêm nhân viên");
    expect(html).toContain("Tìm theo tên hoặc email");
    if (empty) expect(html).toContain("Chưa có nhân viên");
    else {
      for (const member of membershipFixtures) expect(html.replace(/<[^>]*>/g, " ")).not.toContain(member.user_id);
      expect(html.match(/<tr\b/g)).toHaveLength(membershipFixtures.length + 1);
      for (const label of ["Đang hoạt động", "Tạm khoá", "Bếp trung tâm · Bán hàng", "Chi nhánh và vai trò"]) expect(html).toContain(label);
    }
  });

  it("keeps membership mutations hidden for read-only access and denies unverified access", () => {
    const html = surfaceMarkup(memberships(membershipFixtures, ["org:membership:read"]));
    expect(html).toContain("Đang hoạt động");
    expect(html.replace(/<[^>]*>/g, " ")).not.toContain("user-ACTIVE");
    for (const label of ["Thêm nhân viên"]) expect(html).not.toMatch(new RegExp(`<button[^>]*>${label}</button>`));
    const denied = surfaceMarkup(React.createElement(MembershipsView));
    expect(denied).toContain("Bạn không có quyền mở nội dung này.");
    expect(denied).not.toContain("user-ACTIVE");
  });
});

const productionFixtures: ProductionOrder[] = (["HANDED_OFF", "ACCEPTED", "ALLOCATED", "IN_PROGRESS", "COMPLETED", "QC_PASSED", "QC_FAILED", "FAILED"] as const).map((status) => ({
  id: status, order_code: `ORDER-${status}`, source_plan_ref: "plan", target_ref: "target", branch_ref: "branch",
  output_sku_ref: "sku", bom_ref: "bom", planned_quantity: 20, actual_output_quantity: 10, uom: "EA", status, created_at: "2026-09-29",
}));
const shelfFixtures: ShelfPlacement[] = (["PLACED", "DEPLETED"] as const).map((status) => ({
  id: status, finished_lot_ref: "lot", branch_ref: "branch", shelf_code: `SHELF-${status}`, placed_quantity: 20,
  available_quantity: status === "PLACED" ? 10 : 0, uom: "EA", status, trace_code: `QR-${status}`, placed_at: "2026-09-29",
}));
const productionPermissions = ["production:order:update"];
function withAccess(actions: string[], child: React.ReactElement, { roles = [] as string[], branchId = "branch" } = {}) {
  return React.createElement(AccessProvider, { value: { plane: "company", root: "", actions: new Set(actions), scope: { userId: "user-1", orgId: "org-1", branchId, branchName: "Chi nhánh 1", roles } }, children: child });
}

// EntityPicker keeps a visually hidden input for form value and native validity; it is not a styled control.
const isPickerShim = (tag: string) => tag.includes('aria-hidden="true"') && tag.includes('tabindex="-1"');

function expectS6Roles(html: string, primaryCount: number) {
  expectRoleSurface(html);
  const primaryButtons = (html.match(/<button\b[^>]*>/g) ?? []).filter((button) => PRIMARY_FILL.test(button));
  expect(primaryButtons).toHaveLength(primaryCount);
  for (const control of (html.match(/<(?:input|textarea)\b[^>]*>/g) ?? []).filter((tag) => !isPickerShim(tag))) {
    if (control.includes("border-[var(--input)]")) {
      expect(control).toContain("ring-[var(--ring)]");
      if (!control.includes('type="radio"') && !control.startsWith("<textarea")) expect(control).toContain("min-h-11");
    } else if (control.includes("border-[var(--color-input-border)]")) {
      expect(control).toContain("ring-[var(--color-focus)]");
      if (!control.includes('type="radio"') && !control.startsWith("<textarea")) expect(control).toContain("h-11");
    } else {
      expect(control).toContain("border-input");
      expect(control).toContain("ring-ring/50");
    }
  }
}

describe("S6 rendered inventory, permission and production state roles", () => {
  it.each([false, true])("keeps shelves labelled states, QR links and fail-closed action (empty=%s)", (empty) => {
    const html = surfaceMarkup(React.createElement(ShelvesView, { initialPlacements: empty ? [] : shelfFixtures }));
    expectS6Roles(html, 1);
    expect(classesFor(html, "button")).toMatch(PRIMARY_FILL);
    expect(html).toContain('disabled=""');
    if (empty) expect(html).toContain("Chưa có mặt hàng nào được đưa lên kệ");
    else {
      expect(html).toContain("PLACED");
      expect(html).toContain("DEPLETED");
      expect(html).toContain("border-border");
      expect(classesFor(html, "a")).toContain("text-primary");
      expect(html).toContain('href="/traceability/QR-PLACED"');
    }
  });

  it("gives shelf submit sole primary emphasis with EntityPicker and permission guard", () => {
    const html = surfaceMarkup(withAccess(["inventory:shelf_placement:create"], React.createElement(ShelvesView, { initialPlacements: shelfFixtures })), [shelfFixtures, false, "", true, "KE-MAT-01", "lot", 20, false]);
    expectS6Roles(html, 1);
    expect(classesFor(html, "button")).not.toMatch(PRIMARY_FILL);
    expect(classesFor(html, "button", 'type="submit"')).toMatch(PRIMARY_FILL);
    expect(html.match(/required=""/g)).toHaveLength(2);
    const comboboxes = (html.match(/<button\b[^>]*>/g) ?? []).filter((button) => button.includes('role="combobox"'));
    expect(comboboxes).toHaveLength(1);
    expect(comboboxes[0]).toContain('aria-required="true"');
    expect(comboboxes[0]).toContain('id="finished-lot-picker"');
    expect(html).toContain('for="finished-lot-picker"');
    expect(html).toContain("Lô thành phẩm đã QC đạt");
    expect(html).toContain('>Tìm theo mã lệnh sản xuất<');
    expect(html).not.toContain('placeholder="UUID');
    expect(html).not.toContain('type="hidden"');
    expect(html.match(/<button[^>]*type="submit"[^>]*>/)?.[0]).toContain('disabled=""');
    expect(html).toContain("Xác nhận lên kệ &amp; Sinh mã QR");
  });

  it.each([false, true])("preserves production permission visibility and labelled workflow (authorized=%s)", (authorized) => {
    const html = surfaceMarkup(withAccess(authorized ? productionPermissions : [], React.createElement(OrdersView, { initialOrders: productionFixtures }), { roles: ["VT-10"] }), [productionFixtures, false, "", null]);
    expectS6Roles(html, authorized ? 1 : 0);
    for (const status of productionFixtures.map((order) => order.status)) expect(html).toContain(status);
    expect(html).toContain("QC Đạt — Sẵn sàng lên kệ");
    expect(html).toContain("Chờ QC nghiệm thu (VT-13)");
    expect(html.includes("Tiếp nhận (VT-09)")).toBe(authorized);
    expect((html.match(/<button\b[\s\S]*?<\/button>/g) ?? []).some((button) => button.includes("Phân bổ FEFO"))).toBe(authorized);
    expect(html.includes("Bắt đầu nấu (VT-10/11)")).toBe(authorized);
    expect(html.includes("Đóng gói &amp; Cấp đông (VT-12)")).toBe(authorized);
  });

  it("keeps production empty and busy branches", () => {
    const empty = surfaceMarkup(React.createElement(OrdersView, { initialOrders: [] }));
    expectS6Roles(empty, 0);
    expect(empty).toContain("Chưa có lệnh sản xuất nào");
    const busy = surfaceMarkup(withAccess(productionPermissions, React.createElement(OrdersView, { initialOrders: productionFixtures })), [productionFixtures, false, "", "HANDED_OFF"]);
    expectS6Roles(busy, 1);
    expect(classesFor(busy, "button")).toMatch(PRIMARY_FILL);
    expect(busy).toContain('disabled=""');
  });

  it("renders QC pass/fail as readable status labels alongside semantic indicators", () => {
    const html = surfaceMarkup(React.createElement(QCView, { completedOrders: productionFixtures }));
    expectS6Roles(html, 1);
    for (const status of ["QC_PASSED", "QC_FAILED"]) {
      const row = (html.match(/<tr\b[\s\S]*?<\/tr>/g) ?? []).find((item) => item.includes(`ORDER-${status}`))!;
      const cells = row.match(/<td\b[\s\S]*?<\/td>/g)!;
      expect(cells[2]).toContain(`>${status}</span>`);
      expect(cells[2]).toContain(status === "QC_PASSED" ? "border-border" : "bg-destructive-soft");
    }
    expect(html).toContain("Đã phê duyệt đạt chuẩn");
    expect(html).toContain("SoD Enforcement");
  });

  it.each([false, true])("keeps QC form decisions, package states and busy disabling (busy=%s)", (busy) => {
    const html = surfaceMarkup(React.createElement(QCView, { completedOrders: productionFixtures }), [productionFixtures, false, "", productionFixtures[4], -18.5, !busy, busy ? "" : "Mẫu đạt", busy]);
    expectS6Roles(html, 1);
    expect(html).toContain("Phê duyệt QC (PASS) — Cho phép lên kệ");
    expect(html).toContain("Từ chối QC (FAIL) — Hủy lô");
    expect(html).toContain("Hủy bỏ");
    expect(html).toContain('role="radiogroup"');
    expect(html.match(/aria-checked="true"/g)).toHaveLength(1);
    if (busy) expect(html.match(/disabled=""/g)).toHaveLength(2);
  });

  it("keeps QC empty message and separation warning readable", () => {
    const html = surfaceMarkup(React.createElement(QCView, { completedOrders: [] }));
    expectS6Roles(html, 0);
    expect(html).toContain("Không có lô thành phẩm nào đang chờ kiểm định QC");
    expect(html).toContain("text-warning");
  });
});


const targetFixtures: ProductionTarget[] = (["DRAFT", "APPROVED", "IN_PLANNING", "HANDED_OFF", "COMPLETED", "REJECTED"] as const).map((status) => ({
  id: status, target_code: `TARGET-${status}`, title: `Chỉ tiêu ${status}`, branch_ref: "branch-1",
  period_start: "2026-09-29", period_end: "2026-10-29", status, created_by: "user-1", created_at: "2026-09-29",
  lines: [{ product_ref: "product-1", target_quantity: 20, uom: "EA" }],
}));
const salesOrderFixtures: Order[] = (["CREATED", "CANCELLED"] as const).map((status) => ({
  id: `SALE-${status}`, cart_ref: "cart-1", status, subtotal_vnd: 660000, total_vnd: 660000, created_at: "2026-09-29",
}));
function s7Markup(element: React.ReactNode, states: unknown[]) {
  portalRender.states = [...states];
  try { return mountedMarkup(element); } finally { portalRender.states = []; }
}
function expectS7Roles(html: string, primaryCount: number, rawOnly = false) {
  expectRoleSurface(html, rawOnly);
  // Include asChild anchors as well as ordinary buttons in CTA competition.
  const primary = (html.match(/<(?:button|a)\b[^>]*>/g) ?? []).filter((tag) => PRIMARY_FILL.test(tag));
  expect(primary).toHaveLength(primaryCount);
  for (const tag of (html.match(/<(?:input|select)\b[^>]*>/g) ?? []).filter((tag) => !tag.includes('type="hidden"') && !isPickerShim(tag))) {
    // The Field control set (components/ui/field.tsx `control`), or the shadcn Input.
    if (tag.includes("border-[var(--input)]")) {
      expect(tag).toContain("min-h-11");
      expect(tag).toContain("ring-[var(--ring)]");
    } else if (tag.includes("border-[var(--color-input-border)]")) {
      expect(tag).toContain("h-11");
      expect(tag).toContain("ring-[var(--color-focus)]");
    } else {
      expect(tag).toContain("border-input");
      expect(tag).toContain("ring-ring/50");
    }
  }
}
describe("S7 rendered target, cart, orders and product creation roles", () => {
  it.each([false, true])("keeps target permissions, labelled statuses and sole create/submit emphasis (form=%s)", (form) => {
    const html = surfaceMarkup(withAccess(["production:target:create", "production:target_approval:create"], React.createElement(TargetsView, { initialTargets: targetFixtures }), { branchId: "branch-1" }), [
      targetFixtures, false, "", form,
      "Chỉ tiêu tháng", "2026-09-29", "2026-10-29", targetFixtures[0].lines, false,
    ]);
    expectS7Roles(html, 1);
    for (const target of targetFixtures) expect(html).toContain(target.target_code);
    expect(html).toContain("border-border");
    expect(html).toContain("bg-destructive");
    expect(html).toContain("Duyệt");
    expect(html).toContain("Từ chối");
    expect(html).toContain('href="/production/food-plans?target_id=APPROVED"');
    if (form) {
      expect(classesFor(html, "button", 'type="submit"')).toMatch(PRIMARY_FILL);
      expect(html).toContain("Lưu chỉ tiêu");
      expect(html).toContain('aria-label="Xóa dòng"');
      expect(html.match(/required=""/g)).toHaveLength(2);
      expect(html).toContain('aria-required="true"');
    }
  });
  it("keeps target empty and permission-denied actions fail closed", () => {
    const html = surfaceMarkup(React.createElement(TargetsView, { initialTargets: [] }));
    expectS7Roles(html, 0);
    expect(html).toContain("Chưa có chỉ tiêu sản xuất");
    expect(html).not.toContain("Tạo chỉ tiêu</button>");
  });
  it("keeps order status labels alongside semantic cues and original amounts/links", () => {
    const html = surfaceMarkup(React.createElement(SalesOrdersView), [salesOrderFixtures, false, ""]);
    expectS7Roles(html, 0);
    for (const order of salesOrderFixtures) {
      const link = (html.match(/<a\b[\s\S]*?<\/a>/g) ?? []).find((tag) => tag.includes(`/orders/${order.id}`))!;
      expect(link).toContain(`>${order.status === "CANCELLED" ? "Đã hủy" : "Đã đặt"}</span>`);
      expect(link).toContain("text-[var(--color-ink)]");
      expect(link).toContain(order.status === "CANCELLED" ? "bg-destructive" : "border-border");
      expect(link).toContain("660.000");
      expect(link).toContain(formatDateTime(order.created_at));
      expect(link).not.toContain(order.cart_ref);
      expect(link).not.toContain("Giỏ");
    }
  });
  it.each(["loading", "empty", "error"])("preserves orders %s feedback", (state) => {
    const html = surfaceMarkup(React.createElement(SalesOrdersView), [[], state === "loading", state === "error" ? "Lỗi kết nối" : ""]);
    expectRoleSurface(html);
    expect(html).toContain(state === "loading" ? "Đang tải đơn hàng…" : state === "empty" ? "Chưa có đơn hàng" : "Lỗi kết nối");
    if (state === "error") {
      expect(html).toContain('role="alert"');
      expect(html).toContain('data-slot="alert"');
    }
    if (state === "empty") expect(html).toContain('href="/products"');
  });
  it.each([false, true])("keeps product fields, values, validation constraints and submit feedback (busy=%s)", (busy) => {
    const html = s7Markup(React.createElement(ProductCreateDialog, { open: true, onOpenChange: () => {} }), ["Cá hồi", "ca-hoi", busy]);
    expectS7Roles(html, 1, true);
    expect(html).toContain('role="dialog"');
    for (const value of ["Cá hồi", "ca-hoi"]) expect(html).toContain(value);
    expect(html.match(/required=""/g)).toHaveLength(2);
    expect(html).toContain('pattern="[a-z0-9]+(-[a-z0-9]+)*"');
    expect(html).not.toMatch(/<option\b|<select\b|<textarea\b|min="0"|step="1000"/);
    expect(html).toContain(busy ? "Đang tạo..." : "Lưu bản nháp (DRAFT)");
    expect((html.match(/disabled=""/g) ?? []).length).toBe(busy ? 2 : 0);
  });
});


const s8Products: Product[] = (["ACTIVE", "DRAFT", "SUSPENDED"] as const).map((status) => ({
  id: status, sku_code: `SKU-${status}`, name: `Cá hồi ${status}`, description: "Bảo quản lạnh",
  barcode: "893001", uom: "kg", base_price_vnd: 300000, status, created_at: "2026-09-29",
}));
const s8Trace: PublicTraceability = {
  trace_code: "TRACE-42", product_name: "Cá hồi", variant_name: "250 g", qc_status: "PASS",
  produced_at: "2026-09-29", expires_at: "2026-10-29",
  ingredients: [{ material_name: "Cá hồi", supplier_code: "SUP-42" }],
  timeline: [{ stage: "QC", title: "Kiểm định hoàn tất", timestamp: "2026-09-29", passed: true }],
};

// Query the rendered SSR tree by label association, independent of generated IDs.
// Wrapped radio labels and explicit for/id pairs both name their controls.
function getByLabelText(html: string, text: string) {
  const plainText = (markup: string) => markup.replace(/<[^>]*>/g, "").replaceAll("&amp;", "&").trim();
  const labels = [...html.matchAll(/<label\b([^>]*)>([\s\S]*?)<\/label>/g)]
    .filter((label) => plainText(label[2]) === text);
  expect(labels, `label: ${text}`).toHaveLength(1);
  const id = labels[0][1].match(/\bfor="([^"]+)"/)?.[1];
  const controls = id
    ? (html.match(/<(?:input|select|textarea|button)\b[^>]*>/g) ?? []).filter((control) => control.includes(`id="${id}"`))
    : labels[0][2].match(/<(?:input|select|textarea)\b[^>]*>/g) ?? [];
  expect(controls, `control named by label: ${text}`).toHaveLength(1);
  return controls[0];
}

function catalogueFilters(html: string) {
  return (html.match(/<button\b[\s\S]*?<\/button>/g) ?? [])
    .filter((button) => />(?:Tất cả|Đang mở bán|Bản nháp) \(\d+\)<\/button>/.test(button));
}

describe("review fix rendered accessibility and filter selection", () => {
  it.each([
    ["Tên sản phẩm (*)", "input"],
    ["Mã sản phẩm (*)", "input"],
  ])("finds the product control by its label: %s", (label, tag) => {
    const html = s7Markup(React.createElement(ProductCreateDialog, { open: true, onOpenChange: () => {} }), []);
    expect(getByLabelText(html, label)).toMatch(new RegExp(`^<${tag}\\b`));
  });

  it.each([
    ["Nhiệt độ tâm sau cấp đông (°C)", "input", 'type="number"'],
    ["Ghi nhận kiểm tra cảm quan", "textarea", 'required=""'],
    ["Bao bì nguyên vẹn, hút chân không đạt", "button", 'role="radio"'],
    ["Bao bì lỗi / hở", "button", 'role="radio"'],
  ])("finds the QC control by its label: %s", (label, tag, attribute) => {
    const html = surfaceMarkup(React.createElement(QCView, { completedOrders: productionFixtures }),
      [productionFixtures, false, "", productionFixtures[4], -18.5, true, "Mẫu đạt", false]);
    const control = getByLabelText(html, label);
    expect(control).toMatch(new RegExp(`^<${tag}\\b`));
    expect(control).toContain(attribute);
  });

  it("moves the sole pressed filter and its leading hidden Check icon through rendered click handlers", () => {
    portalRender.filter = "ALL";
    try {
      for (const label of ["Tất cả (3)", "Đang mở bán (1)", "Bản nháp (1)", "Tất cả (3)"]) {
        if (portalRender.filterClicks[label]) portalRender.filterClicks[label]();
        const html = surfaceMarkup(React.createElement(ProductsView, { initialProducts: s8Products, canCreate: true }));
        const filters = catalogueFilters(html);
        expect(filters).toHaveLength(3);
        const pressed = filters.filter((button) => button.includes('aria-pressed="true"'));
        expect(pressed).toHaveLength(1);
        expect(pressed[0].replace(/<[^>]*>/g, "").trim()).toBe(label);
        const checks = pressed[0].match(/<svg\b[^>]*class="[^"]*\blucide-check\b[^"]*"[^>]*>/g) ?? [];
        expect(checks).toHaveLength(1);
        expect(checks[0]).toContain('aria-hidden="true"');
        expect(pressed[0]).toMatch(/<button\b[^>]*><svg\b/);
        for (const button of filters.filter((button) => button !== pressed[0])) {
          expect(button).toContain('aria-pressed="false"');
          expect(button).not.toContain("lucide-check");
        }
        expectS7Roles(html, 1);
      }
    } finally {
      portalRender.filter = undefined;
      portalRender.filterClicks = {};
    }
  });

  it.each(["ALL", "ACTIVE", "DRAFT"])("uses secondary selection and outline alternatives without destructive styling (%s)", (filter) => {
    const html = surfaceMarkup(React.createElement(ProductsView, { initialProducts: s8Products, canCreate: true }), [s8Products, "", filter, false]);
    const filters = catalogueFilters(html);
    expect(filters).toHaveLength(3);
    expect(filters.filter((button) => button.includes('aria-pressed="true"'))).toHaveLength(1);
    for (const button of filters) {
      const classes = classesFor(button, "button");
      expect(classes).not.toMatch(/(?:^|\s)(?:bg|text|border)-destructive|color-danger/);
      if (button.includes('aria-pressed="true"')) {
        expect(classes).toContain("bg-secondary");
        expect(classes).toContain("text-secondary-foreground");
      } else {
        expect(classes).toContain("bg-background");
        expect(classes).toContain("hover:bg-accent");
      }
    }
    expectS7Roles(html, 1);
  });
});

describe("S8 rendered product and traceability roles", () => {
  it.each(s8Products)("preserves detail status, facts and CTA hierarchy ($status)", (product) => {
    const html = surfaceMarkup(React.createElement(ProductDetailView, { initialProduct: product }));
    expectS7Roles(html, 1);
    for (const value of [product.name, "Bảo quản lạnh", "300.000"]) expect(html).toContain(value);
    for (const hidden of [product.sku_code, "893001", "Kích hoạt", "Tạm ngưng bán", "Đang mở bán", "Bản nháp"]) expect(html).not.toContain(hidden);
    expect(html).toContain('href="/products"');
    expect(html).not.toMatch(/<img\b/);
    expect(html.replace(/<svg\b[\s\S]*?<\/svg>/g, "")).not.toMatch(/text-\[var\(--color-leaf\)\]/);
    expect(html).toContain("Thêm vào giỏ hàng");
    expect(html).toContain('aria-label="Giảm số lượng"');
    expect(html).toContain('aria-label="Tăng số lượng"');
  });
  it.each(["ALL", "ACTIVE", "DRAFT"])("keeps one catalogue primary with neutral selected filter (%s)", (filter) => {
    const html = surfaceMarkup(React.createElement(ProductsView, { initialProducts: s8Products, canCreate: true }), [s8Products, "", filter, false]);
    expectS7Roles(html, 1);
    expect(html).toContain("Tạo sản phẩm mới");
    expect(html.replace(/<svg\b[\s\S]*?<\/svg>/g, "")).not.toMatch(/text-\[var\(--color-leaf\)\]/);
    expect(html).toContain("Đang mở bán (ACTIVE)");
    expect(html).toContain("Bản nháp (DRAFT)");
    if (filter === "ALL") {
      for (const label of ["Đang mở bán", "Bản nháp", "Tạm ngưng", "Chi tiết"]) expect(html).toContain(label);
      expect(html).not.toContain("+ Giỏ");
      expect(html).toContain("300.000");
      expect(html).toContain('href="/products/ACTIVE"');
    }
  });
  it.each(["api", "unavailable"] as const)("preserves catalogue empty/error state (%s)", (dataSource) => {
    const html = surfaceMarkup(React.createElement(ProductsView, { initialProducts: [], dataSource, canCreate: true }));
    expectS7Roles(html, 1);
    expect(html).toContain("Chưa có sản phẩm");
    if (dataSource === "unavailable") {
      expect(html).toContain('role="alert"');
      expect(html).toContain("Không thể tải dữ liệu từ Sales API");
      expect(html).toContain("lucide-triangle-alert");
    }
  });
  it.each([false, true])("keeps trace facts, status text/icons and solid timeline (empty=%s)", (empty) => {
    const trace = empty ? { ...s8Trace, ingredients: [], timeline: [] } : s8Trace;
    const html = surfaceMarkup(React.createElement(TraceView, { trace }));
    // Trace is read-only: it has no existing CTA to recolour or invent.
    expectS7Roles(html, 0);
    expect(html).toContain("bg-background");
    expect(html).toContain("TRACE-42");
    expect(html).toContain("PASS");
    expect(html).toContain("250 g");
    expect(html).not.toMatch(/lucide-(?:shield-check|leaf|award|clock|qr-code)/);
    expect(html).toContain("text-foreground");
    expect(html).not.toMatch(/<img\b/);
    if (!empty) {
      const title = (html.match(/<h4\b[^>]*>[^<]*<\/h4>/g) ?? [])[0];
      expect(title).toContain("Kiểm định hoàn tất");
      expect(title).toContain("text-foreground");
      expect(html).toContain("SUP-42");
      expect(html).not.toContain("lucide-circle-check");
      expect(html).toContain("before:bg-border");
    }
  });
});


it("S18 retires shared screens and exposes independent shells", () => {
  for (const file of ["components/auth/login-form.tsx", "components/layout/auth-shell.tsx"]) {
    expect(() => readFileSync(file), file + ": legacy screen still exists").toThrow();
  }
  for (const [Shell, journey] of [[CustomerAuthShell,"customer"],[EmployeeAuthShell,"employee"]] as const) {
    const html = renderToStaticMarkup(React.createElement(Shell, null, "form"));
    expect(html.match(/<main/g)).toHaveLength(1);
    expect(html.match(/data-auth-journey=/g)).toHaveLength(1);
    expect(html).toContain(`data-auth-journey="${journey}"`);
    expect(html).toContain("Sunny");
  }
});

vi.mock("next-intl", async original => {
 const actual = await original<typeof import("next-intl")>();
 return {...actual, useTranslations: (namespace: string) => actual.createTranslator({locale: "vi", messages: JSON.parse(readFileSync("messages/vi.json", "utf8")), namespace})};
});
