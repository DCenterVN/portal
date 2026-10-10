import { readFileSync } from "node:fs";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { ButtonProps } from "@/components/ui/button";
import { ThemeProvider } from "@/components/theme-provider";
import { ThemeToggle } from "@/components/layout/theme-toggle";

// Copied verbatim from brain/inbox/portal-ui-preview/Main.dc.html lines 14-15 (approved preview).
const PREVIEW_LIGHT = "--l0:#F4F4F5;--l1:#FFFFFF;--l1-2:#FAFAFA;--line:#E4E4E7;--line-strong:#8A8A8A;--fg:#18181B;--fg-2:#52525B;--fg-3:#71717A;--p:#D2402A;--p-hover:#B3361F;--p-text:#B3361F;--p-soft:#FCEBE7;--ok:#2F7A3B;--ok-soft:#E8F3EA;--warn:#A86A12;--warn-soft:#FDF1DE;--err:#9B2C55;--err-soft:#F7E6EC;--glass-l2:rgba(255,255,255,.72);--glass-l3:rgba(255,255,255,.86);--glass-edge:rgba(255,255,255,.65);--shadow-l3:0 12px 32px -8px rgba(24,24,27,.18),0 2px 6px rgba(24,24,27,.06);--scrim:rgba(24,24,27,.4)";
const PREVIEW_DARK = "--l0:#0F0F11;--l1:#18181B;--l1-2:#202024;--line:#2E2E33;--line-strong:#71717A;--fg:#FAFAF9;--fg-2:#A1A1AA;--fg-3:#8B8B94;--p-text:#F06A52;--p-soft:#3A1D18;--ok:#5FB36C;--ok-soft:#1B2A1E;--warn:#E3A24A;--warn-soft:#2E2414;--err:#E07A9E;--err-soft:#2E1822;--glass-l2:rgba(24,24,27,.72);--glass-l3:rgba(32,32,36,.86);--glass-edge:rgba(255,255,255,.08);--shadow-l3:0 12px 32px -8px rgba(0,0,0,.6);--scrim:rgba(0,0,0,.6)";

const css = readFileSync("app/globals.css", "utf8");
const layout = readFileSync("app/layout.tsx", "utf8");

const decls = (body: string) =>
  Object.fromEntries([...body.matchAll(/(--[\w-]+)\s*:\s*([^;]+?)\s*(?:;|$)/g)].map((m) => [m[1], m[2].replace(/\s*,\s*/g, ",")]));

function block(selector: string) {
  const at = css.indexOf(`${selector} {`);
  expect(at, `missing block ${selector}`).toBeGreaterThan(-1);
  const start = css.indexOf("{", at) + 1;
  return decls(css.slice(start, css.indexOf("}", start)));
}

const light = decls(PREVIEW_LIGHT);
const dark = decls(PREVIEW_DARK);

describe("FR-1 preview tokens in globals.css", () => {
  it("copies 23 light and 21 dark preview tokens", () => {
    expect(Object.keys(light)).toHaveLength(23);
    expect(Object.keys(dark)).toHaveLength(21);
  });

  it("declares every light token with the preview value", () => {
    expect(block(':root, [data-theme="light"]')).toMatchObject(light);
  });

  it("declares exactly the dark tokens for an explicit choice and for the system preference", () => {
    expect(block('[data-theme="dark"], .dark')).toEqual(dark);
    const media = css.slice(css.indexOf("@media (prefers-color-scheme: dark) {\n  :root:not([data-theme=\"light\"]) {"));
    expect(media.length).toBeLessThan(css.length);
    const start = media.indexOf("{", media.indexOf(":root:not")) + 1;
    expect(decls(media.slice(start, media.indexOf("}", start)))).toEqual(dark);
  });

  it("declares the radius and motion scales", () => {
    expect(block(':root, [data-theme="light"]')).toMatchObject({
      "--r-0": "0", "--r-2": "2px", "--r-4": "4px", "--r-8": "8px", "--r-12": "12px", "--r-full": "999px",
      "--d-hover": "100ms", "--d-1": "150ms", "--d-2": "200ms", "--d-3": "300ms", "--d-4": "400ms",
    });
  });

  it("maps tokens to Tailwind utilities through @theme inline", () => {
    const theme = block("@theme inline");
    for (const name of Object.keys(light).filter((n) => n !== "--shadow-l3")) expect(theme[`--color-${name.slice(2)}`]).toBe(`var(${name})`);
    expect(theme).toMatchObject({
      "--shadow-l3": "var(--shadow-l3)",
      "--font-heading": "var(--font-heading)", "--font-body": "var(--font-body)",
      "--radius-sm": "var(--r-4)", "--radius-lg": "var(--r-8)", "--radius-xl": "var(--r-12)", "--radius-full": "var(--r-full)",
    });
  });

  it("turns off transitions and animations for reduced motion", () => {
    expect(css).toMatch(/@media \(prefers-reduced-motion: reduce\) \{\s*\*, \*::before, \*::after \{[^}]*animation: none !important;[^}]*transition: none !important;/);
  });
});

describe("FR-1 fonts and no-flash theme script in layout.tsx", () => {
  it.each([
    ["Be_Vietnam_Pro", "--font-heading", '["700"]'],
    ["Nunito", "--font-body", null],
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
