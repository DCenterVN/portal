import { readFileSync } from "node:fs";
import { describe, expect, it, vi } from "vitest";
import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { ConsoleSidebar } from "../components/layout/console-sidebar";
import { Input } from "../components/ui/input";
import { Dialog, DialogContent } from "../components/ui/dialog";
import { Badge } from "../components/ui/badge";
import { ToastContainer, type ToastVariant } from "../components/ui/toast";
import { ConfirmQCDecisionModal } from "../components/modals/confirm-qc-decision-modal";
import { SessionTimeoutModal } from "../components/modals/session-timeout-modal";
import { buttonVariants } from "../components/ui/button";
import { LoginForm } from "../features/customer-auth/login-form";
import { CustomerAuthShell } from "../components/layout/customer-auth-shell";
import { EmployeeAuthShell } from "../components/layout/employee-auth-shell";
import ProfileClient from "./(store)/me/profile-client";
import { StaffProfileContainer } from "../features/staff-profile/staff-profile-container";
import {AccountEditContainer} from "../features/account-edit/account-edit-container";
import { SWRConfig, unstable_serialize } from "swr";
import { AccessProvider } from "../features/platform/access-boundary";
import type { Membership } from "../lib/api/platform-client";
import { BranchesView } from "../features/branches/branches-view";
import { MembershipsView } from "../features/memberships/memberships-view";
import { ThemeProvider } from "../components/theme-provider";
import { ShelvesView } from "../features/inventory/shelves-view";
import { RolesView } from "../features/roles/roles-view";
import { OrdersView } from "../features/production/orders-view";
import { QCView } from "../features/production/qc-view";
import { TargetsView } from "../features/production/targets-view";
import { CartView } from "../features/products/cart-view";
import { OrdersView as SalesOrdersView } from "../features/products/orders-view";
import { ProductCreateDialog } from "../features/products/product-create-dialog";
import { ProductDetailView } from "../features/products/product-detail-view";
import { ProductsView } from "../features/products/products-view";
import { TraceView } from "../features/traceability/trace-view";
import type { Product } from "../lib/api/sales";
import type { PublicTraceability } from "../lib/api/production";
import type { Cart, Order } from "../lib/api/sales";
import type { ProductionTarget, ProductionOrder, ShelfPlacement } from "../lib/api/production";
import type { UserProfile } from "../lib/auth/client";

// SSR cannot mount a portal. Only expose its rendered tree; effects/keyboard are
// covered by the existing dialog behavior tests and the later browser audit.
const portalRender = vi.hoisted(() => ({
  mounted: false, profileTab: "general", states: [] as unknown[],
  filter: undefined as string | undefined,
  filterClicks: {} as Record<string, () => void>,
}));
vi.mock("../components/ui/toast", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../components/ui/toast")>();
  return { ...actual, useToast: () => ({ toast: vi.fn() }) };
});
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }), useSearchParams: () => new URLSearchParams() }));
vi.mock("react", async (importOriginal) => {
  const actual = await importOriginal<typeof React>();
  return { ...actual, useState: (initial: unknown) => {
    if(initial === "general") return actual.useState(portalRender.profileTab);
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

function classesFor(html: string, tag: string, attribute = "") {
  const element = html.match(new RegExp(`<${tag}\\b[^>]*${attribute}[^>]*>`))?.[0];
  expect(element).toBeDefined();
  return element!.match(/class="([^"]*)"/)?.[1] ?? "";
}

describe("S3 rendered sidebar and controls", () => {
  it.each([false, true])("uses warm surface roles and focused tomato selection (collapsed=%s)", (collapsed) => {
    const html = renderToStaticMarkup(React.createElement(ConsoleSidebar, {
      id: "brand-sidebar", collapsed, pathname: "/inventory/lots",
      nav: [{ title: "Vận hành", items: [
        { href: "/inventory", match: "/inventory", label: "Kho" },
        { href: "/orders", match: "/orders", label: "Đơn hàng" },
      ] }], context: { label: "Chi nhánh", sublabel: "Hà Nội" },
      user: { name: "Dawn", detail: "Nhân viên" }, logo: "VS",
    }));
    const aside = classesFor(html, "aside");
    expect(aside).toContain("bg-[var(--color-surface)]");
    expect(aside).toContain("text-[var(--color-ink)]");
    expect(aside).toContain(collapsed ? "w-17" : "w-60");
    const active = classesFor(html, "a", 'aria-current="page"');
    expect(active).toContain("bg-[var(--color-tint)]");
    expect(active).toContain("text-[var(--color-ink)]");
    expect(active).toContain("border-l-[var(--color-primary)]");
    const links = html.match(/<a\b[^>]*>/g)!;
    expect(links).toHaveLength(2);
    for (const link of links) {
      expect(link).toContain("focus-visible:ring-2");
      expect(link).toContain("focus-visible:ring-[var(--color-focus)]");
    }
    expect(html).toContain("text-[var(--color-muted)]");
    expect(html).not.toMatch(/color-chrome|color-sun|color-leaf|color-mix|text-\[color:white\]|#[\da-f]{3,8}\b/i);
  });

  it("renders a 44px input with role border, radius, surface and visible focus", () => {
    const html = renderToStaticMarkup(React.createElement(Input, {
      type: "password", name: "password", autoComplete: "current-password", disabled: true, "aria-label": "Mật khẩu",
    }));
    const classes = classesFor(html, "input");
    for (const token of ["h-11", "border-[var(--color-input-border)]", "rounded-[var(--radius-md)]", "bg-[var(--color-surface)]", "text-[var(--color-ink)]", "focus-visible:ring-2", "focus-visible:ring-[var(--color-focus)]"]) expect(classes).toContain(token);
    expect(html).toContain('style="border-width:1.5px"');
    expect(classes).not.toMatch(/\bh-(?:9|10)\b/);
    expect(html).toContain('type="password"');
    expect(html).toContain('name="password"');
    expect(html).toContain('autoComplete="current-password"');
    expect(html).toContain('disabled=""');
  });

  it.each(["standard", "critical", "session"] as const)("renders solid token dialog/overlay in layer %s", (layer) => {
    portalRender.mounted = true;
    vi.stubGlobal("document", { body: {} });
    vi.stubGlobal("HTMLElement", class {});
    try {
      const html = renderToStaticMarkup(React.createElement(Dialog, { open: true },
        React.createElement(DialogContent, { layer, "aria-labelledby": "brand-dialog", size: "sm" }, "Nội dung")));
      const surface = classesFor(html, "div", 'role="dialog"');
      for (const token of ["bg-l1", "text-fg", "rounded-xl", "shadow-l3", "focus-visible:ring-2", "focus-visible:ring-[var(--ring)]"]) expect(surface).toContain(token);
      const overlay = classesFor(html, "div", 'aria-hidden="true"');
      expect(overlay).toContain("bg-scrim");
      expect(html).not.toMatch(/blur|glass|gradient|#[\da-f]{3,8}\b/i);
      expect(html).toContain('aria-modal="true"');
      expect(html).toContain('aria-labelledby="brand-dialog"');
      expect(surface).toContain("max-w-sm");
      expect(html.includes('aria-label="Đóng hộp thoại"')).toBe(layer === "standard");
    } finally {
      portalRender.mounted = false;
      vi.unstubAllGlobals();
    }
    expect(readFileSync("components/ui/dialog.tsx", "utf8")).not.toMatch(/backdrop-blur|backdrop-filter|#[\da-f]{3,8}\b/i);
  });
});

const css = readFileSync("app/globals.css", "utf8");
const generated = readFileSync("app/tokens.generated.css", "utf8");
const layout = readFileSync("app/layout.tsx", "utf8");
const roles = "bg surface tint ink muted primary primary-ink primary-hover leaf accent accent-ink accent-hover sun info danger warn-ink line input-border focus".split(" ");
const palette = {
  light: "#FBF6EE #FFFFFF #F5E9DA #2A1D17 #6F5C50 #D2402A #FFFFFF #B93623 #3E8E4A #F2A33A #2A1D17 #DB8A26 #F2A33A #2E6FAD #9B2C55 #805000 #EADFD0 #8A7464 #B93623",
  dark: "#1D1714 #2A211C #352821 #F8EFE5 #C2B2A4 #F07A5F #1D1714 #E56449 #70B878 #F2A33A #2A1D17 #DB8A26 #F2A33A #8DB8E8 #E46A83 #F2C56F #49372C #8D7667 #F07A5F",
};
const legacy = Object.fromEntries(Object.entries(palette).map(([mode, values]) =>
  [mode, Object.fromEntries(roles.map((role, index) => [role, values.split(" ")[index]]))])) as Record<"light" | "dark", Record<string, string>>;
const declarations = (body: string) => Object.fromEntries([...body.matchAll(/--([\w-]+):\s*([^;]+);/g)].map((match) => [match[1], match[2]]));
const generatedBlocks = [...generated.matchAll(/\{([^{}]+)\}/g)].map((match) => declarations(match[1]));
const cssBlock = (selector: string) => {
  const start = css.indexOf(`${selector} {`);
  expect(start).toBeGreaterThan(-1);
  return declarations(css.slice(css.indexOf("{", start) + 1, css.indexOf("}", start)));
};
const tokenSelectors = /(?::root, \[data-theme="light"\]|\[data-theme="dark"\], \.dark|:root:not\(\[data-theme="light"\]\)) \{\s*--l0:[^}]*\}/g;

describe("S2 root brand contract", () => {
  it.each([
    ["Be_Vietnam_Pro", ["700"], "--font-heading"],
    ["Nunito", ["400", "500", "600", "700", "800"], "--font-body"],
  ] as const)("loads %s with Vietnamese/Latin, explicit weights and swap", (font, weights, variable) => {
    expect(layout).toMatch(new RegExp(`import \\{[^}]*\\b${font}\\b[^}]*\\} from "next/font/google"`));
    const options = layout.match(new RegExp(`const (\\w+) = ${font}\\(\\{([\\s\\S]*?)\\}\\)`));
    expect(options).not.toBeNull();
    const config = options![2];
    expect(config.match(/subsets:\s*(\[[^\]]*\])/)?.[1]).toBe('["vietnamese", "latin"]');
    expect(config.match(/weight:\s*(\[[^\]]*\])/)?.[1]).toBe(JSON.stringify(weights).replaceAll(",", ", "));
    expect(config).toContain(`variable: "${variable}"`);
    expect(config).toContain('display: "swap"');
    expect(layout).toContain(`\${${options![1]}.variable}`);
    expect(layout).not.toMatch(/Quicksand/i);
  });

  it("uses solid primary for the default and legacy accent CTA with visible focus", () => {
    for (const variant of [undefined, "default", "accent"] as const) {
      const classes = buttonVariants({ variant });
      expect(classes).toContain("bg-[var(--primary)]");
      expect(classes).toContain("text-[var(--primary-foreground)]");
      expect(classes).toContain("hover:bg-[var(--color-primary-hover)]");
      expect(classes).toContain("focus-visible:ring-2");
      expect(classes).toContain("focus-visible:ring-[var(--ring)]");
      expect(classes).not.toMatch(/gradient|background-image|color-mix/);
    }
  });

  it("matches browser chrome and icon colours to the approved light/dark roles", () => {
    const manifest = JSON.parse(readFileSync("public/manifest.json", "utf8"));
    expect(manifest.theme_color).toBe(generatedBlocks[0]["color-primary"]);
    expect(manifest.theme_color).toBe(cssBlock(':root, [data-theme="light"]').p);
    expect(manifest.background_color).toBe(generatedBlocks[0]["color-bg"]);
    const icon = readFileSync("app/icon.svg", "utf8");
    expect(icon).toContain(`fill="${generatedBlocks[0]["color-primary"]}"`);
    expect(icon).toContain(`stroke="${generatedBlocks[0]["color-primary-ink"]}"`);
    for (const [mode, index] of [["light", 0], ["dark", 1]] as const) {
      expect(layout).toContain(`{ media: "(prefers-color-scheme: ${mode})", color: "${generatedBlocks[index]["color-bg"]}" }`);
    }
  });

  it("keeps identity while describing factual meal-kit preparation", () => {
    expect(layout).toContain('"https://vietsach.reborn.vn"');
    expect(layout).toContain('siteName: "Việt Sạch"');
    expect(layout).toContain("Fresh Meal Kit");
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

  it("keeps legacy elevations and radii, and points legacy font roles at the loaded heading/body fonts", () => {
    expect(generatedBlocks[0]).toMatchObject({
      "elevation-shadow-card": "0 2px 8px rgb(42 29 23 / .08)",
      "elevation-shadow-pop": "0 12px 28px rgb(42 29 23 / .18)",
      "radius-sm": "8px", "radius-md": "12px", "radius-lg": "16px", "radius-pill": "9999px",
    });
    expect(cssBlock(':root, [data-theme="light"]')).toMatchObject({ "font-display": "var(--font-heading)", "font-sans": "var(--font-body)" });
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
    for (const background of ["accent", "accent-hover", "sun"]) expect(ratio("accent-ink", background)).toBeGreaterThanOrEqual(4.5);
  });

  it("uses role aliases for semantic status, tags, destructive foreground and radius", () => {
    const aliases = {
      "destructive-foreground": "color-primary-ink", radius: "radius-md",
      "badge-active-bg": "color-tint", "badge-active-text": "color-ink", "badge-active-dot": "color-leaf",
      "badge-suspended-bg": "color-tint", "badge-suspended-text": "color-warn-ink", "badge-suspended-dot": "color-sun",
      "badge-revoked-bg": "color-tint", "badge-revoked-text": "color-danger", "badge-revoked-dot": "color-danger",
      "tag-bg": "color-tint", "tag-text": "color-ink", "tag-border": "color-line",
    };
    for (const [alias, role] of Object.entries(aliases)) expect(css).toContain(`--${alias}: var(--${role});`);
    expect(css.replace(tokenSelectors, "")).not.toMatch(/#[\da-f]{3,8}\b|--land-(?:green|sage)|color-mix\([^;]*transparent/i);
    expect(css.match(tokenSelectors)).toHaveLength(3);
  });

  it.each(["light", "dark"] as const)("meets AA contrast with the preview tokens in %s", (mode) => {
    const colors = { ...cssBlock(':root, [data-theme="light"]'), ...(mode === "dark" ? cssBlock('[data-theme="dark"], .dark') : {}) };
    const ratio = (fg: string, bg: string) => contrast(colors[fg], colors[bg]);
    for (const background of ["l0", "l1", "l1-2"]) {
      for (const foreground of ["fg", "fg-2", "p-text", "ok", "err"]) expect(ratio(foreground, background), `${foreground}/${background}`).toBeGreaterThanOrEqual(4.5);
      for (const control of ["line-strong", "warn"]) expect(ratio(control, background), `${control}/${background}`).toBeGreaterThanOrEqual(3);
    }
    for (const background of ["l1", "l1-2"]) expect(ratio("fg-3", background), `fg-3/${background}`).toBeGreaterThanOrEqual(4.5);
    for (const background of ["p", "p-hover"]) expect(contrast("#FFFFFF", colors[background]), `#fff/${background}`).toBeGreaterThanOrEqual(4.5);
    for (const [foreground, background] of [["p-text", "p-soft"], ["ok", "ok-soft"], ["err", "err-soft"]]) expect(ratio(foreground, background), `${foreground}/${background}`).toBeGreaterThanOrEqual(4.5);
  });

  it("keeps landing text/CTA contrast-safe, uses elevation shadows and loader fallbacks", () => {
    expect(css).toContain("--land-link: var(--color-primary-hover);");
    expect(css).toContain("--land-primary: var(--color-primary);");
    expect(css).toContain("--land-primary-ink: var(--color-primary-ink);");
    expect(css).toContain("--land-link: var(--color-primary);");
    expect(css).toContain("--color-chrome: var(--color-ink);");
    expect(css).toContain("--color-chrome: var(--color-bg);");
    expect(css.match(/box-shadow:\s*([^;]+);/g)).toEqual(["box-shadow: var(--elevation-shadow-pop);"]);
    expect(css).toContain("font-family: var(--font-body);");
    expect(css).toContain("font-family: var(--font-heading);");
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
    ["active", "Đang hoạt động", "ink", "leaf"],
    ["suspended", "Tạm ngưng", "warn-ink", "sun"],
    ["revoked", "Đã thu hồi", "danger", "danger"],
  ] as const)("renders %s badge with readable text and semantic indicator", (variant, label, ink, indicator) => {
    const html = renderToStaticMarkup(React.createElement(Badge, { variant, "aria-label": label }, label));
    const classes = classesFor(html, "div");
    const aliases: Record<string, string> = { active: "active", suspended: "suspended", revoked: "revoked" };
    expect(classes).toContain(`bg-[var(--badge-${aliases[variant]}-bg)]`);
    expect(classes).toContain(`text-[var(--badge-${aliases[variant]}-text)]`);
    expect(css).toContain(`--badge-${aliases[variant]}-text: var(--color-${ink});`);
    expect(css).toContain(`--badge-${aliases[variant]}-dot: var(--color-${indicator});`);
    expect(html).toContain(label);
    expect(classesFor(html, "span")).toContain(`bg-[var(--badge-${aliases[variant]}-dot)]`);
    expect(html).not.toMatch(rawDecoration);
    expect(classes).not.toContain("text-[var(--color-leaf)]");
    const withoutDot = renderToStaticMarkup(React.createElement(Badge, { variant, dot: false }, label));
    expect(withoutDot).toContain(label);
    expect(withoutDot).not.toContain("<span");
  });

  it.each(["active", "suspended", "revoked"] as const)("keeps %s meaningful without caller text, including dot=false", (variant) => {
    for (const dot of [true, false]) {
      const html = renderToStaticMarkup(React.createElement(Badge, { variant, dot }));
      expect(html.replace(/<[^>]*>/g, "").trim()).not.toBe("");
    }
  });

  it.each([
    ["success", "leaf", "circle-check"],
    ["warning", "sun", "triangle-alert"],
    ["error", "danger", "circle-alert"],
    ["info", "info", "lucide-info"],
  ] as const)("renders %s toast with solid surface, semantic icon and ink label", (variant, indicator, icon) => {
    const html = mountedMarkup(React.createElement(ToastContainer, {
      toasts: [{ id: variant, variant: variant as ToastVariant, title: "Trạng thái xử lý", description: "Chi tiết thao tác" }], onDismiss: () => {},
    }));
    expect(html).toContain('aria-live="polite"');
    expect(html).toContain('aria-atomic="true"');
    const role = variant === "error" ? 'role="alert"' : 'role="status"';
    expect(html).toContain(role);
    expect(classesFor(html, "div", role)).toContain("bg-l1");
    const svg = html.match(/<svg\b[^>]*>/g)!;
    expect(svg).toHaveLength(2);
    expect(svg[0]).toContain(icon);
    expect(svg[0]).toContain(`text-[var(--color-${indicator})]`);
    expect(classesFor(html, "h4")).toContain("text-[var(--color-ink)]");
    expect(html).toContain("Trạng thái xử lý");
    expect(html).toContain("Chi tiết thao tác");
    expect(html).toContain('aria-label="Đóng thông báo"');
    expect(classesFor(html, "button")).toContain("focus-visible:ring-[var(--color-focus)]");
    expect(html).not.toMatch(rawDecoration);
    expect(html).not.toContain("/95");
  });

  it.each(["qc", "session"] as const)("renders %s modal with solid role decoration and existing actions", (kind) => {
    const element = kind === "qc"
      ? React.createElement(ConfirmQCDecisionModal, { open: true, onOpenChange: () => {}, productName: "Lô kiểm tra", lotCode: "LOT-42" })
      : React.createElement(SessionTimeoutModal, { open: true, userName: "Dawn", userEmail: "dawn@example.test" });
    const html = mountedMarkup(element);
    expect(html).toContain('role="dialog"');
    expect(html).toContain("bg-[var(--color-surface)]");
    expect(html).toContain("bg-[var(--color-tint)]");
    expect(html).not.toMatch(rawDecoration);
    if (kind === "qc") {
      expect(html).toContain("Lô kiểm tra");
      expect(html).toContain("ĐẠT");
      expect(html).toContain("Xác nhận nhập kho thương mại");
      expect(html).toContain("Huỷ bỏ");
    } else {
      expect(html).toContain("Dawn");
      expect(html).toContain('aria-pressed="true"');
      expect(html).toContain("Ẩn mật khẩu");
      expect(html).toContain("Đăng nhập bằng tài khoản khác");
      expect(html).not.toContain('aria-label="Đóng hộp thoại"');
    }
    // Also cover decoration of session's client-only error branch.
    expect(readFileSync(`components/modals/${kind === "qc" ? "confirm-qc-decision" : "session-timeout"}-modal.tsx`, "utf8")).not.toMatch(rawDecoration);
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
const staffProfile = (profile: UserProfile) => React.createElement(SWRConfig, { value: { provider:()=>new Map(), fallback: { "/api/auth/me": profile }, revalidateOnMount: false } }, React.createElement(StaffProfileContainer, {editor: React.createElement(AccountEditContainer,{loginPath:"/staff/login"})}));
const branchFixtures = ["branch-1", "branch-2"].map((id) => ({
  id, name: `Chi nhánh ${id}`, code: id, address: "Hà Nội", type: "MAIN", tempZone: "-18 °C", membersCount: 3,
}));
const membershipFixtures: Membership[] = (["ACTIVE", "SUSPENDED"] as const).map((status) => ({
  id: status, user_id: `user-${status}`, branch_id: "branch-1", role_codes: ["SALES"], status,
}));
function memberships(items: Membership[], actions = ["org:membership:read", "org:employee:create", "org:membership:update"]) {
  return React.createElement(AccessProvider, { value: { plane: "company", root: "", actions: new Set(actions) }, children:
    React.createElement(SWRConfig, { value: { provider: () => new Map(), revalidateOnMount: false,
      fallback: { [unstable_serialize(["company-memberships", 1])]: { items, page: 1, limit: 20, total: items.length } },
    } }, React.createElement(MembershipsView)) });
}
const rawSurface = /(?:bg|text|border|ring|from|via|to|fill|stroke|shadow)-(?:slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose|white|black)(?:-\d+)?\b|#[\da-f]{3,8}\b|gradient|blur|glass/i;

function expectRoleSurface(html: string, rawOnly = false) {
  // This exact shared PageHeader icon wrapper belongs to a later slice. All
  // caller actions and content remain in the rendered scan, including inputs.
  // Frame L3 glass tokens (popover/EntityPicker listbox) are sanctioned; raw glass/blur stays banned.
  const owned = html.replace(/class="flex size-9 items-center justify-center rounded-xl bg-sky-500\/10 text-\[var\(--primary\)\] shrink-0 \[&amp;_svg\]:size-5"/g, "")
    .replace(/\b(?:border-glass-edge|bg-glass-l3|glass-blur-l3)\b/g, "");
  expect(owned.match(rawSurface)?.[0] ?? null).toBeNull();
  if (rawOnly) return;
  expect(html).toContain("text-[var(--color-ink)]");
  expect(html).toContain("bg-[var(--color-surface)]");
  expect(html).toContain("border-[var(--color-line)]");
  for (const heading of html.match(/<h[1-4]\b[^>]*>/g) ?? []) {
    // h1–h3 inherit the root display role; h4 needs an explicit role.
    if (heading.startsWith("<h4")) expect(heading).toContain("font-[family-name:var(--font-quicksand,var(--font-display))]");
    else expect(css).toMatch(/h1, h2, h3, \.font-serif\s*\{\s*font-family: var\(--font-heading\)/);
  }
}

describe("S5 rendered auth, profile, branch and membership roles", () => {
  it("keeps customer login fields and solid role branding", () => {
    const html = surfaceMarkup(React.createElement(ThemeProvider, null, React.createElement(CustomerAuthShell, null, React.createElement(LoginForm))));
    expectRoleSurface(html);
    expect(html).toContain("bg-p ");
    const labels = [...html.matchAll(/<label[^>]*for="([^"]+)"/g)].map(match => match[1]);
    expect(labels).toHaveLength(2);
    for (const id of labels) expect(html).toContain(`id="${id}"`);
    expect(html).toContain('type="password"');
    expect(html).toContain("Đăng ký");
    for (const input of html.match(/<input[^>]*type="(?:text|password)"[^>]*>/g)!) {
      expect(input).toContain("h-10");
      expect(input).not.toMatch(/\bh-(?:9|11)\b/);
    }
  });

  it.each(["general", "security"])("renders profile %s tab with solid roles and original content", (tab) => {
    portalRender.profileTab=tab;
    const html = surfaceMarkup(React.createElement(SWRConfig, {value:{provider:()=>new Map(),fallback:{"/api/auth/me":profileFixture},revalidateOnMount:false}},React.createElement(ProfileClient)));
    expectRoleSurface(html);
    expect(html).toContain("Dawn");
    expect(html).toContain("Đăng xuất");
    expect(html).toContain("bg-primary");
    expect(html).toContain(tab === "general" ? "Lưu thay đổi" : "Đổi mật khẩu");
    if (tab === "security") expect(classesFor(html,"input")).toContain("text-[var(--color-ink)]");
  });

  it("renders staff profile memberships with solid roles and original content", () => {
    const html = surfaceMarkup(staffProfile(profileFixture));
    expectRoleSurface(html, true);
    expect(html).toContain("Dawn");
    expect(html).toContain("Đăng xuất");
    expect(html).toContain("Bếp Hà Nội");
  });

  it.each([401, 500])("renders profile error %s with readable danger cue", (status) => {
    const html = surfaceMarkup(React.createElement(SWRConfig, {value:{provider:()=>new Map([["/api/auth/me",{error:Object.assign(Error("Lỗi kết nối"),{status})}]]),revalidateOnMount:false}}, React.createElement(ProfileClient)), ["general"]);
    expectRoleSurface(html);
    expect(html).toContain("text-[var(--color-danger)]");
    expect(html).toContain(status === 401 ? "Đăng nhập lại" : "Thử lại");
  });

  it("keeps profile loading and empty memberships distinct", () => {
    const loading = surfaceMarkup(React.createElement(StaffProfileContainer, {editor: React.createElement(AccountEditContainer,{loginPath:"/staff/login"})}));
    expect(loading).toContain("Đang tải hồ sơ nhân viên…");
    expect(loading).not.toMatch(rawSurface);
    const empty = surfaceMarkup(staffProfile({ ...profileFixture, memberships: [] }));
    expectRoleSurface(empty, true);
    expect(empty).toContain("Tài khoản chưa có phạm vi truy cập.");
  });

  it("renders selected and unselected branches with ink status and role boundaries", () => {
    const html = surfaceMarkup(React.createElement(BranchesView, { initialBranches: branchFixtures }));
    expectRoleSurface(html);
    expect(html).toContain("Đang vận hành");
    expect(html).toContain("text-[var(--color-leaf)]");
    expect(html).toContain("ring-[var(--color-focus)]");
    expect(html).toContain("Chọn chi nhánh này");
    expect(classesFor(html, "input")).toContain("h-11");
  });

  it.each([false, true])("renders membership table and semantic statuses (empty=%s)", (empty) => {
    const html = surfaceMarkup(memberships(empty ? [] : membershipFixtures));
    expectRoleSurface(html, true);
    expect(html).toContain("bg-[var(--color-surface)]");
    expect(html).toContain("border-[var(--color-line)]");
    expect(html).toContain("text-[var(--foreground)]");
    expect(html).toContain("Thêm nhân viên");
    expect(html).toContain("Trang 1");
    if (empty) expect(html).toContain("Chưa có nhân viên");
    else {
      for (const member of membershipFixtures) expect(html).not.toContain(member.user_id);
      expect(html.match(/<tr\b/g)).toHaveLength(membershipFixtures.length + 1);
      for (const status of ["active", "suspended"]) expect(html).toContain(`var(--badge-${status}-text)`);
      for (const label of ["Đang hoạt động", "Tạm khoá", "Bán hàng", "Đổi vai trò", "Khoá", "Mở khoá"]) expect(html).toContain(label);
    }
  });

  it("renders add employee sheet with solid scrim and required name, email, password and role fields", () => {
    const html = s7Markup(memberships(membershipFixtures), [1, { kind: "create" }, "", "", ["SALES"], false, ""]);
    expectRoleSurface(html, true);
    expect(html).toContain("bg-[var(--color-surface)]");
    expect(html).toContain("border-[var(--color-line)]");
    expect(html).toContain("text-[var(--foreground)]");
    expect(html).toContain('role="dialog"');
    expect(html).toContain("bg-scrim");
    for (const label of ["Thêm nhân viên", "Họ và tên", "Email", "Vai trò", "Lưu", "Huỷ"]) expect(html).toContain(label);
    expect(html.match(/required=""/g)).toHaveLength(3);
    expect(html).toContain('type="email"');
    const passwordInput = html.match(/<input\b[^>]*id="member-password"[^>]*>/)?.[0];
    expect(passwordInput).toContain('type="password"');
    expect(passwordInput).toContain('autoComplete="new-password"');
    expect(html.match(/type="checkbox"/g)).toHaveLength(5);
    expect(html).toContain('checked=""');
    const inputs = html.match(/<input\b[^>]*id="member-(?:name|email|password)"[^>]*>/g) ?? [];
    expect(inputs).toHaveLength(3);
    for (const input of inputs) {
      expect(input).toContain("min-h-11");
      expect(input).toContain("border-[var(--input)]");
      expect(input).toContain("focus-visible:ring-[var(--ring)]");
    }
    expect(classesFor(html, "button", 'type="submit"')).toContain("bg-[var(--primary)]");
    expect(html).toMatch(/<button[^>]*type="submit"[^>]*disabled=""/);
  });

  it("keeps membership mutations hidden for read-only access and denies unverified access", () => {
    const html = surfaceMarkup(memberships(membershipFixtures, ["org:membership:read"]));
    expect(html).toContain("Đang hoạt động");
    expect(html).not.toContain("user-ACTIVE");
    for (const label of ["Thêm nhân viên", "Đổi vai trò", "Mở khoá"]) expect(html).not.toMatch(new RegExp(`<button[^>]*>${label}</button>`));
    const denied = surfaceMarkup(React.createElement(MembershipsView));
    expect(denied).toContain("Bạn chưa có quyền xem nhân viên.");
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

function expectS6Roles(html: string, primaryCount: number) {
  expectRoleSurface(html);
  expect(html).toContain("bg-[var(--color-bg)]");
  const primaryButtons = (html.match(/<button\b[^>]*>/g) ?? []).filter((button) => button.includes("bg-[var(--primary)]"));
  expect(primaryButtons).toHaveLength(primaryCount);
  for (const control of html.match(/<(?:input|textarea)\b[^>]*>/g) ?? []) {
    if (control.includes('role="combobox"')) {
      expect(control).toContain("border-[var(--input)]");
      expect(control).toContain("ring-[var(--ring)]");
      expect(control).toContain("min-h-11");
    } else {
      expect(control).toContain("border-[var(--color-input-border)]");
      expect(control).toContain("ring-[var(--color-focus)]");
      if (!control.includes('type="radio"') && !control.startsWith("<textarea")) expect(control).toContain("h-11");
    }
  }
}

describe("S6 rendered inventory, permission and production state roles", () => {
  it.each([false, true])("keeps shelves labelled states, QR links and fail-closed action (empty=%s)", (empty) => {
    const html = surfaceMarkup(React.createElement(ShelvesView, { initialPlacements: empty ? [] : shelfFixtures }));
    expectS6Roles(html, 1);
    expect(classesFor(html, "button")).toContain("bg-[var(--primary)]");
    expect(html).toContain('disabled=""');
    if (empty) expect(html).toContain("Chưa có mặt hàng nào được đưa lên kệ");
    else {
      expect(html).toContain("PLACED");
      expect(html).toContain("DEPLETED");
      expect(html).toContain("badge-active-dot");
      expect(classesFor(html, "a")).toContain("text-[var(--color-primary-hover)]");
      expect(classesFor(html, "a")).toContain("dark:text-[var(--color-primary)]");
      expect(html).toContain('href="/traceability/QR-PLACED"');
    }
  });

  it("gives shelf submit sole primary emphasis with EntityPicker and permission guard", () => {
    const html = surfaceMarkup(React.createElement(ShelvesView, { initialPlacements: shelfFixtures }), [shelfFixtures, true, "KE-MAT-01", "lot", "branch", ["inventory:shelf_placement:create"], 20, false]);
    expectS6Roles(html, 1);
    expect(classesFor(html, "button")).not.toContain("bg-[var(--primary)]");
    expect(classesFor(html, "button", 'type="submit"')).toContain("bg-[var(--primary)]");
    expect(html.match(/required=""/g)).toHaveLength(2);
    const comboboxes = (html.match(/<input\b[^>]*>/g) ?? []).filter((input) => input.includes('role="combobox"'));
    expect(comboboxes).toHaveLength(1);
    expect(comboboxes[0]).toContain('aria-required="true"');
    expect(comboboxes[0]).toContain('id="finished-lot-picker"');
    expect(html).toContain('for="finished-lot-picker"');
    expect(html).toContain("Lô thành phẩm đã QC đạt");
    expect(html).toContain('placeholder="Tìm theo mã lệnh sản xuất"');
    expect(html).not.toContain('placeholder="UUID');
    expect(html).not.toContain('type="hidden"');
    expect(html.match(/<button[^>]*type="submit"[^>]*>/)?.[0]).toContain('disabled=""');
    expect(html).toContain("Xác nhận lên kệ &amp; Sinh mã QR");
  });

  it.each([false, true])("keeps permission checks and saved confirmation non-colour cues (saved=%s)", (saved) => {
    const html = surfaceMarkup(React.createElement(RolesView), ["", {}, saved]);
    expectS6Roles(html, 1);
    expect(html).toContain("overflow-x-auto");
    expect(html).toContain("lucide-check");
    expect(html).toContain("bg-[var(--color-primary)]");
    expect(html).toContain("text-[var(--color-primary-ink)]");
    expect(html).toContain("View (Xem)");
    if (saved) {
      expect(html).toContain("Đã lưu ma trận!");
      expect(html).toContain("text-[var(--color-leaf)]");
    }
  });

  it("keeps collapsed and search-empty permission matrix with one save action", () => {
    const collapsed = surfaceMarkup(React.createElement(RolesView), ["", { inventory_coldchain: true }, false]);
    expectS6Roles(collapsed, 1);
    expect(collapsed).toContain("lucide-chevron-right");
    expect(collapsed).not.toContain('title="Giám đốc chi nhánh: View (Xem) - Kiểm nhận');
    const empty = surfaceMarkup(React.createElement(RolesView), ["NO-MATCH", {}, false]);
    expectS6Roles(empty, 1);
    expect(empty).not.toContain("lucide-chevron-down");
  });

  it.each([false, true])("preserves production permission visibility and labelled workflow (authorized=%s)", (authorized) => {
    const html = surfaceMarkup(React.createElement(OrdersView, { initialOrders: productionFixtures }), [productionFixtures, null, authorized ? productionPermissions : [], "VT-10"]);
    expectS6Roles(html, authorized ? 1 : 0);
    for (const status of productionFixtures.map((order) => order.status)) expect(html).toContain(status);
    expect(html).toContain("QC Đạt — Sẵn sàng lên kệ");
    expect(html).toContain("Chờ QC nghiệm thu (VT-13)");
    expect(html).toContain("text-[var(--color-leaf)]");
    expect(html).toContain("text-[var(--color-sun)]");
    expect(html.includes("Tiếp nhận (VT-09)")).toBe(authorized);
    expect((html.match(/<button\b[\s\S]*?<\/button>/g) ?? []).some((button) => button.includes("Phân bổ FEFO"))).toBe(authorized);
    expect(html.includes("Bắt đầu nấu (VT-10/11)")).toBe(authorized);
    expect(html.includes("Đóng gói &amp; Cấp đông (VT-12)")).toBe(authorized);
  });

  it("keeps production empty and busy branches", () => {
    const empty = surfaceMarkup(React.createElement(OrdersView, { initialOrders: [] }));
    expectS6Roles(empty, 0);
    expect(empty).toContain("Chưa có lệnh sản xuất nào");
    const busy = surfaceMarkup(React.createElement(OrdersView, { initialOrders: productionFixtures }), [productionFixtures, "HANDED_OFF", productionPermissions, "VT-11"]);
    expectS6Roles(busy, 1);
    expect(classesFor(busy, "button")).toContain("bg-[var(--primary)]");
    expect(busy).toContain('disabled=""');
  });

  it("renders QC pass/fail as readable status labels alongside semantic indicators", () => {
    const html = surfaceMarkup(React.createElement(QCView, { completedOrders: productionFixtures }));
    expectS6Roles(html, 1);
    for (const status of ["QC_PASSED", "QC_FAILED"]) {
      const row = (html.match(/<tr\b[\s\S]*?<\/tr>/g) ?? []).find((item) => item.includes(`ORDER-${status}`))!;
      const cells = row.match(/<td\b[\s\S]*?<\/td>/g)!;
      expect(cells[2]).toContain(`>${status}</div>`);
      expect(cells[2]).toContain(status === "QC_PASSED" ? "badge-active-dot" : "badge-revoked-dot");
    }
    expect(html).toContain("Đã phê duyệt đạt chuẩn");
    expect(html).toContain("SoD Enforcement");
  });

  it.each([false, true])("keeps QC form decisions, package states and busy disabling (busy=%s)", (busy) => {
    const html = surfaceMarkup(React.createElement(QCView, { completedOrders: productionFixtures }), [productionFixtures, productionFixtures[4], -18.5, !busy, busy ? "" : "Mẫu đạt", busy]);
    expectS6Roles(html, 1);
    expect(html).toContain("Phê duyệt QC (PASS) — Cho phép lên kệ");
    expect(html).toContain("Từ chối QC (FAIL) — Hủy lô");
    expect(html).toContain("Hủy bỏ");
    expect(html).toContain("lucide-circle-check");
    expect(html).toContain("lucide-circle-x");
    expect(html).toContain('name="packageCheck"');
    expect(html.match(/checked=""/g)).toHaveLength(1);
    if (busy) expect(html.match(/disabled=""/g)).toHaveLength(2);
  });

  it("keeps QC empty message and separation warning readable", () => {
    const html = surfaceMarkup(React.createElement(QCView, { completedOrders: [] }));
    expectS6Roles(html, 0);
    expect(html).toContain("Không có lô thành phẩm nào đang chờ kiểm định QC");
    expect(html).toContain("text-[var(--color-warn-ink)]");
  });
});


const targetFixtures: ProductionTarget[] = (["DRAFT", "APPROVED", "IN_PLANNING", "HANDED_OFF", "COMPLETED", "REJECTED"] as const).map((status) => ({
  id: status, target_code: `TARGET-${status}`, title: `Chỉ tiêu ${status}`, branch_ref: "branch-1",
  period_start: "2026-09-29", period_end: "2026-10-29", status, created_by: "user-1", created_at: "2026-09-29",
  lines: [{ product_ref: "product-1", target_quantity: 20, uom: "EA" }],
}));
const cartFixture: Cart = { id: "cart-1", total_amount_vnd: 999, items: [
  { product_id: "fish", sku_code: "SKU-FISH", name: "Cá hồi", quantity: 2, price_snapshot_vnd: 300000, uom: "kg" },
  { product_id: "rice", sku_code: "SKU-RICE", name: "Gạo", quantity: 3, price_snapshot_vnd: 20000, uom: "túi" },
] };
const salesOrderFixtures: Order[] = (["CREATED", "CANCELLED"] as const).map((status) => ({
  id: `SALE-${status}`, cart_ref: "cart-1", status, subtotal_vnd: 660000, total_vnd: 660000, created_at: "2026-09-29",
}));
function s7Markup(element: React.ReactNode, states: unknown[]) {
  portalRender.states = [...states];
  try { return mountedMarkup(element); } finally { portalRender.states = []; }
}
function expectS7Roles(html: string, primaryCount: number) {
  expectRoleSurface(html);
  // Include asChild anchors as well as ordinary buttons in CTA competition.
  const primary = (html.match(/<(?:button|a)\b[^>]*>/g) ?? []).filter((tag) => /bg-\[var\(--(?:color-)?primary\)\]/.test(tag));
  expect(primary).toHaveLength(primaryCount);
  for (const tag of (html.match(/<(?:input|select)\b[^>]*>/g) ?? []).filter((tag) => !tag.includes('type="hidden"'))) {
    expect(tag).toContain("h-11");
    // Legacy Field tokens, or the frame control set (components/ui/field.tsx `control`).
    const frame = tag.includes("border-[var(--input)]");
    expect(tag).toContain(frame ? "border-[var(--input)]" : "border-[var(--color-input-border)]");
    expect(tag).toContain(frame ? "ring-[var(--ring)]" : "ring-[var(--color-focus)]");
  }
}
describe("S7 rendered target, cart, orders and product creation roles", () => {
  it.each([false, true])("keeps target permissions, labelled statuses and sole create/submit emphasis (form=%s)", (form) => {
    const html = surfaceMarkup(React.createElement(TargetsView, { initialTargets: targetFixtures }), [
      targetFixtures, ["production:target:create", "production:target_approval:create"], "branch-1", form,
      "Chỉ tiêu tháng", "2026-09-29", "2026-10-29", targetFixtures[0].lines, false,
    ]);
    expectS7Roles(html, 1);
    for (const target of targetFixtures) expect(html).toContain(target.target_code);
    expect(html).toContain("badge-active-dot");
    expect(html).toContain("badge-revoked-dot");
    expect(html).toContain("text-[var(--color-leaf)]");
    expect(html).toContain("Duyệt");
    expect(html).toContain("Từ chối");
    expect(html).toContain('href="/production/food-plans?target_id=APPROVED"');
    if (form) {
      expect(classesFor(html, "button", 'type="submit"')).toContain("bg-[var(--primary)]");
      expect(html).toContain("Lưu chỉ tiêu");
      expect(html).toContain('aria-label="Xóa dòng"');
      expect(html.match(/required=""/g)).toHaveLength(5);
      expect(html).toContain('aria-required="true"');
    }
  });
  it("keeps target empty and permission-denied actions fail closed", () => {
    const html = surfaceMarkup(React.createElement(TargetsView, { initialTargets: [] }));
    expectS7Roles(html, 0);
    expect(html).toContain("Chưa có chỉ tiêu sản xuất");
    expect(html).not.toContain("Tạo chỉ tiêu</button>");
  });
  it.each([false, true])("keeps derived cart totals, data and checkout disabling (busy=%s)", (busy) => {
    const html = surfaceMarkup(React.createElement(CartView, { initialCart: cartFixture }), [cartFixture.items, cartFixture.id, busy, null]);
    expectS7Roles(html, 1);
    for (const label of ["Cá hồi", "SKU-FISH", "Gạo", "SKU-RICE", "660.000", "600.000", "60.000"]) expect(html).toContain(label);
    expect(html).toContain('>5</span>');
    expect(html).not.toContain("999");
    expect(html.includes('disabled=""')).toBe(busy);
    expect(html).toContain(busy ? "Đang tạo đơn hàng..." : "Tạo Đơn Hàng");
  });
  it("keeps empty cart and success dialog meaningful with one primary", () => {
    const empty = surfaceMarkup(React.createElement(CartView));
    expectS7Roles(empty, 1);
    expect(empty).toContain("Giỏ hàng hiện đang trống.");
    expect(empty).toContain('disabled=""');
    const success = s7Markup(React.createElement(CartView, { initialCart: cartFixture }), [[], "", false, "SALE-42"]);
    expectS7Roles(success, 1);
    expect(success).toContain("SALE-42");
    expect(success).toContain("Đã Tạo Đơn Hàng Thành Công!");
    expect(success).toContain("lucide-circle-check");
    expect(success).toContain("text-[var(--color-leaf)]");
  });
  it("keeps order status labels alongside semantic cues and original amounts/links", () => {
    const html = surfaceMarkup(React.createElement(SalesOrdersView), [salesOrderFixtures, false, ""]);
    expectS7Roles(html, 0);
    for (const order of salesOrderFixtures) {
      const link = (html.match(/<a\b[\s\S]*?<\/a>/g) ?? []).find((tag) => tag.includes(`/orders/${order.id}`))!;
      expect(link).toContain(`>${order.status === "CANCELLED" ? "Đã hủy" : "Đã đặt"}</span>`);
      expect(link).toContain("text-[var(--color-ink)]");
      expect(link).toContain(order.status === "CANCELLED" ? "badge-revoked-dot" : "badge-active-dot");
      expect(link).toContain("660.000");
      expect(link).toContain(new Date(order.created_at).toLocaleString("vi-VN"));
      expect(link).not.toContain(order.cart_ref);
      expect(link).not.toContain("Giỏ");
    }
  });
  it.each(["loading", "empty", "error"])("preserves orders %s feedback", (state) => {
    const html = surfaceMarkup(React.createElement(SalesOrdersView), [[], state === "loading", state === "error" ? "Lỗi kết nối" : ""]);
    expectRoleSurface(html);
    expect(html).toContain(state === "loading" ? "Đang tải đơn hàng…" : state === "empty" ? "Chưa có đơn hàng." : "Lỗi kết nối");
    if (state === "error") {
      expect(html).toContain('role="alert"');
      expect(html).toContain("text-[var(--color-danger)]");
      expect(html).toContain("lucide-circle-alert");
    }
    if (state === "empty") expect(classesFor(html, "a")).toContain("text-[var(--color-primary-hover)]");
  });
  it.each([false, true])("keeps product fields, values, validation constraints and submit feedback (busy=%s)", (busy) => {
    const html = s7Markup(React.createElement(ProductCreateDialog, { open: true, onOpenChange: () => {} }), ["Cá hồi", "ca-hoi", busy]);
    expectS7Roles(html, 1);
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
    ? (html.match(/<(?:input|select|textarea)\b[^>]*>/g) ?? []).filter((control) => control.includes(`id="${id}"`))
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

  it("finds the session PIN control by its label", () => {
    const html = s7Markup(React.createElement(SessionTimeoutModal, { open: true }), []);
    expect(getByLabelText(html, "Mật khẩu hoặc mã PIN 6 số")).toMatch(/^<input\b/);
    expect(html).toContain('aria-pressed="true"');
  });

  it.each([
    ["Nhiệt độ tâm sau cấp đông (°C)", "input", 'type="number"'],
    ["Ghi nhận kiểm tra cảm quan", "textarea", 'required=""'],
    ["Bao bì nguyên vẹn, hút chân không đạt", "input", 'type="radio"'],
    ["Bao bì lỗi / hở", "input", 'type="radio"'],
  ])("finds the QC control by its label: %s", (label, tag, attribute) => {
    const html = surfaceMarkup(React.createElement(QCView, { completedOrders: productionFixtures }),
      [productionFixtures, productionFixtures[4], -18.5, true, "Mẫu đạt", false]);
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
      expect(classes).not.toMatch(/destructive|color-danger/);
      if (button.includes('aria-pressed="true"')) {
        expect(classes).toContain("bg-transparent");
        expect(classes).toContain("text-[var(--primary)]");
      } else {
        expect(classes).toContain("bg-[var(--card)]");
        expect(classes).toContain("text-[var(--foreground)]");
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
    expect(html).toContain("Không tìm thấy sản phẩm nào phù hợp");
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
    expect(html).toContain("bg-[var(--color-bg)]");
    expect(html).toContain("TRACE-42");
    expect(html).toContain("PASS");
    expect(html).toContain("250 g");
    expect(html).toContain("lucide-shield-check");
    expect(html).toContain("text-[var(--color-ink)]");
    expect(html).not.toMatch(/<img\b/);
    if (!empty) {
      const title = (html.match(/<h4\b[^>]*>[^<]*<\/h4>/g) ?? [])[0];
      expect(title).toContain("Kiểm định hoàn tất");
      expect(title).toContain("text-[var(--color-ink)]");
      expect(html).toContain("SUP-42");
      expect(html).toContain("lucide-circle-check");
      expect(html).toContain("before:bg-[var(--color-line)]");
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
    expect(html).toContain("Bếp Tươi");
  }
});

vi.mock("next-intl", async original => {
 const actual = await original<typeof import("next-intl")>();
 return {...actual, useLocale:()=>"vi", useTranslations: (namespace: string) => actual.createTranslator({locale: "vi", messages: JSON.parse(readFileSync("messages/vi.json", "utf8")), namespace})};
});
