import { readFileSync } from "node:fs";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { Button } from "@/components/ui/button";
import { ThemeProvider } from "@/components/theme-provider";
import { ThemeToggle } from "@/components/layout/theme-toggle";

const LIGHT = "--background:#FFFFFF;--foreground:#18181B;--card:#FFFFFF;--card-foreground:#18181B;--popover:#FFFFFF;--primary:#2B7A52;--primary-foreground:#FFFFFF;--primary-hover:#236444;--secondary:#F4F4F5;--muted:#F4F4F5;--muted-foreground:#5F5F68;--accent:#F4F4F5;--accent-foreground:#18181B;--destructive:#B91C1C;--destructive-soft:#FEF2F2;--destructive-border:#FECACA;--success:#166534;--success-soft:#F0FDF4;--warning:#92400E;--warning-soft:#FFFBEB;--warning-border:#FDE68A;--border:#E4E4E7;--input:#8C8C96;--ring:#2B7A52;--sidebar:#FAFAFA;--sidebar-foreground:#3F3F46;--sidebar-accent:#EFEFF1;--sidebar-accent-foreground:#18181B;--chart-1:#2B7A52;--glass-l2:#FFFFFF;--glass-l3:#FFFFFF;--glass-edge:#E4E4E7;--scrim:rgba(24,24,27,.4)";
const DARK = "--background:#09090B;--foreground:#FAFAFA;--card:#101012;--card-foreground:#FAFAFA;--popover:#141416;--primary:#4CAF7D;--primary-foreground:#09090B;--primary-hover:#5BBF8A;--secondary:#18181B;--muted:#18181B;--muted-foreground:#A1A1AA;--accent:#1F1F23;--accent-foreground:#FAFAFA;--destructive:#F87171;--destructive-soft:#2A1212;--destructive-border:#5B2020;--success:#5BBF8A;--success-soft:#0F1F17;--warning:#E8B04B;--warning-soft:#231C0D;--warning-border:#4A3A12;--border:#27272A;--input:#666670;--ring:#4CAF7D;--sidebar:#0C0C0E;--sidebar-foreground:#D4D4D8;--sidebar-accent:#1F1F23;--sidebar-accent-foreground:#FAFAFA;--chart-1:#4CAF7D;--glass-l2:#141416;--glass-l3:#141416;--glass-edge:#27272A;--scrim:rgba(0,0,0,.6)";

const css = readFileSync("app/globals.css", "utf8");
const generated = readFileSync("app/tokens.generated.css", "utf8");
const layout = readFileSync("app/layout.tsx", "utf8");

const decls = (body: string) =>
  Object.fromEntries([...body.matchAll(/(--[\w-]+)\s*:\s*([^;]+?)\s*(?:;|$)/g)].map((m) => [m[1], m[2].replace(/\s*,\s*/g, ",")]));

function block(source: string, selector: string) {
  const at = source.indexOf(`${selector} {`);
  expect(at, `missing block ${selector}`).toBeGreaterThan(-1);
  const start = source.indexOf("{", at) + 1;
  return decls(source.slice(start, source.indexOf("}", start)));
}

const light = decls(LIGHT);
const dark = decls(DARK);

describe("FR-1 Lá dịu shadcn roles in tokens.generated.css", () => {
  it("declares every light role with the approved value", () => {
    expect(block(generated, ':root, [data-theme="light"]')).toMatchObject(light);
  });

  it("declares the dark roles for an explicit choice and for the system preference", () => {
    expect(block(generated, '[data-theme="dark"], .dark')).toMatchObject(dark);
    const media = generated.slice(generated.indexOf("@media (prefers-color-scheme: dark) {"));
    expect(block(media, ':root:not([data-theme="light"])')).toMatchObject(dark);
  });

  it("declares the radius scale and no leftover motion-duration scale", () => {
    expect(block(generated, ':root, [data-theme="light"]')).toMatchObject({
      "--r-0": "0", "--r-2": "2px", "--r-4": "4px", "--r-6": "6px", "--r-8": "8px", "--r-full": "999px",
    });
    expect(css).not.toMatch(/--d-(?:hover|\d)\s*:/);
  });

  it("maps roles to Tailwind utilities through @theme inline", () => {
    const theme = block(css, "@theme inline");
    for (const name of Object.keys(light).filter((n) => n !== "--shadow-l3")) expect(theme[`--color-${name.slice(2)}`]).toBe(`var(${name})`);
    expect(theme).toMatchObject({
      "--shadow-l3": "var(--shadow-l3)",
      "--font-heading": "var(--font-body)", "--font-body": "var(--font-body)", "--font-mono": "var(--font-mono)",
      "--radius-sm": "var(--r-4)", "--radius-md": "var(--r-6)", "--radius-lg": "var(--r-8)", "--radius-xl": "var(--r-8)", "--radius-full": "var(--r-full)",
    });
  });

  it("turns off transitions and animations for reduced motion", () => {
    expect(css).toMatch(/@media \(prefers-reduced-motion: reduce\) \{\s*\*, \*::before, \*::after \{[^}]*animation: none !important;[^}]*transition: none !important;/);
  });
});

describe("FR-1 fonts and no-flash theme script in layout.tsx", () => {
  it.each([
    ["Inter", "--font-body", '["400", "500", "600"]'],
    ["Geist_Mono", "--font-mono", '["400", "500"]'],
  ] as const)("loads %s as %s with swap and fallback metrics", (font, variable, weight) => {
    expect(layout).toMatch(new RegExp(`import \\{[^}]*\\b${font}\\b[^}]*\\} from "next/font/google"`));
    const options = layout.match(new RegExp(`const (\\w+) = ${font}\\(\\{([\\s\\S]*?)\\}\\)`));
    expect(options).not.toBeNull();
    expect(options![2]).toContain(`variable: "${variable}"`);
    expect(options![2]).toContain('display: "swap"');
    expect(options![2]).toContain("adjustFontFallback: true");
    if (weight) expect(options![2]).toContain(`weight: ${weight}`);
    expect(layout).toContain(`\${${options![1]}.variable}`);
  });

  it("drops Quicksand", () => {
    expect(layout).not.toMatch(/quicksand/i);
    expect(css).not.toMatch(/quicksand/i);
  });

  const script = layout.match(/const themeScript = `([^`]+)`/)?.[1] ?? "";
  const runScript = (saved: string | null, systemDark = false) => {
    const root = { dataset: {} as Record<string, string>, classList: new Set<string>() };
    const doc = { documentElement: { dataset: root.dataset, classList: { toggle: (c: string, on: boolean) => (on ? root.classList.add(c) : root.classList.delete(c)), add: (c: string) => root.classList.add(c) } } };
    const storage = { getItem: () => saved };
    new Function("document", "localStorage", "matchMedia", script)(doc, storage, () => ({ matches: systemDark }));
    return root;
  };

  it("injects the script into <head> before paint", () => {
    expect(script).not.toBe("");
    expect(layout).toMatch(/<head>\s*<script dangerouslySetInnerHTML=\{\{ __html: themeScript \}\} \/>\s*<\/head>/);
  });

  it("applies a saved choice before paint and leaves the system preference alone otherwise", () => {
    expect(runScript("dark").dataset.theme).toBe("dark");
    expect(runScript("dark").classList.has("dark")).toBe(true);
    expect(runScript("light").dataset.theme).toBe("light");
    expect(runScript(null).dataset.theme).toBeUndefined();
    expect(runScript(null, true).dataset.theme).toBeUndefined();
    expect(runScript(null, true).classList.has("dark")).toBe(true);
  });
});

type ButtonProps = React.ComponentProps<typeof Button>;
const captured = vi.hoisted(() => ({ props: null as ButtonProps | null }));
vi.mock("@/components/ui/button", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/components/ui/button")>();
  const Spy = (props: ButtonProps) => {
    captured.props = props;
    return React.createElement(actual.Button, props);
  };
  return { ...actual, Button: Spy };
});

describe("FR-1 ThemeToggle", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("is a ghost icon Button with a Vietnamese label", () => {
    const html = renderToStaticMarkup(<ThemeProvider><ThemeToggle /></ThemeProvider>);
    expect(captured.props).toMatchObject({ variant: "ghost", size: "icon", "aria-label": "Chuyển sang giao diện tối" });
    expect(html).toContain('aria-label="Chuyển sang giao diện tối"');
    expect(html).toContain("lucide-moon");
  });

  it("switches data-theme on <html> and persists the choice", () => {
    const store = new Map<string, string>();
    const root = { dataset: {} as Record<string, string>, classList: { add: vi.fn(), remove: vi.fn() } };
    vi.stubGlobal("document", { documentElement: root });
    vi.stubGlobal("localStorage", { getItem: (k: string) => store.get(k) ?? null, setItem: (k: string, v: string) => store.set(k, v) });
    renderToStaticMarkup(<ThemeProvider><ThemeToggle /></ThemeProvider>);
    captured.props!.onClick!({} as React.MouseEvent<HTMLButtonElement>);
    expect(root.dataset.theme).toBe("dark");
    expect(store.get("dcenter_theme")).toBe("dark");
    expect(root.classList.add).toHaveBeenCalledWith("dark");
  });
});
