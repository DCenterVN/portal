import { beforeEach, describe, it, expect, vi } from "vitest";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { PasswordInput } from "./password-input";

// SSR has no interactive renderer; retain the hook state across explicit renders.
const visibility = vi.hoisted(() => ({ shown: false }));
vi.mock("react", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react")>();
  return {
    ...actual,
    useState: () => [visibility.shown, (update: (shown: boolean) => boolean) => {
      visibility.shown = update(visibility.shown);
    }],
  };
});

describe("PasswordInput", () => {
  const html = renderToStaticMarkup(<PasswordInput id="pw" name="password" autoComplete="new-password" aria-describedby="hint" />);

  it("starts hidden and keeps the field's name, autocomplete and description", () => {
    expect(html).toMatch(/<input[^>]*type="password"/);
    expect(html).toContain('name="password"');
    expect(html).toContain('autoComplete="new-password"');
    expect(html).toContain('aria-describedby="hint"');
  });

  it("has a non-submitting toggle labelled for screen readers", () => {
    expect(html).toMatch(/<button[^>]*type="button"/);
    expect(html).toContain('aria-pressed="false"');
    expect(html).toContain('aria-label="Hiện mật khẩu"');
    expect(html).toMatch(/<button[^>]*class="[^"]*\bsize-9\b/);
  });

  it("disables the toggle with the field", () => {
    const off = renderToStaticMarkup(<PasswordInput name="password" disabled />);
    expect(off.match(/disabled=""/g)).toHaveLength(2);
  });

  it("V-01 toggle has no filled background at rest, only the accent hover, and no ring on the box", () => {
    const toggle = html.match(/<button[^>]*class="([^"]*)"/)?.[1].split(/\s+/) ?? [];
    expect(toggle.filter((name) => /^bg-/.test(name))).toEqual([]);
    expect(toggle).toContain("hover:bg-accent");
    expect(toggle).not.toContain("focus-visible:ring-2");
    expect(toggle.some((name) => /^(active|focus-visible|disabled):bg-/.test(name))).toBe(false);
  });

  it("V-01 keeps the 36px hit area while the field reserves room for it", () => {
    expect(html).toMatch(/<button[^>]*class="[^"]*\bsize-9\b/);
    expect(html).toMatch(/<input[^>]*class="[^"]*\bpr-10\b/);
  });

  beforeEach(() => {
    visibility.shown = false;
  });

  it.each([
    ["Show password", "Hide password"],
    ["Hiện mật khẩu mới", "Ẩn mật khẩu mới"],
  ])("toggles with localized names %s / %s without changing the value", (showLabel, hideLabel) => {
    const props = { showLabel, hideLabel, id: "chosen-password", defaultValue: "fixture password", autoComplete: "new-password" };
    const hidden = PasswordInput(props);
    const before = renderToStaticMarkup(hidden);
    expect(before).toContain(`aria-label="${showLabel}"`);
    expect(before).not.toMatch(/<input[^>]*(showLabel|hideLabel)=/);
    expect(before).toContain('aria-pressed="false"');
    const toggle = hidden.props.children[1].props.children;
    expect(toggle.props.type).toBe("button");
    toggle.props.onClick();
    const shown = PasswordInput(props);
    const after = renderToStaticMarkup(shown);
    expect(after).toMatch(/<input[^>]*type="text"/);
    expect(after).toContain(`aria-label="${hideLabel}"`);
    expect(after).toContain('aria-pressed="true"');
    expect(after).toContain('value="fixture password"');
    expect(after).toContain('id="chosen-password"');
    expect(after).toContain('autoComplete="new-password"');
    expect(shown.props.children[1].props.children.props.type).toBe("button");
    shown.props.children[1].props.children.props.onClick();
    expect(renderToStaticMarkup(PasswordInput(props))).toContain('type="password"');
  });

  it("keeps the legacy hide label after toggling", () => {
    PasswordInput({}).props.children[1].props.children.props.onClick();
    expect(renderToStaticMarkup(PasswordInput({}))).toContain('aria-label="Ẩn mật khẩu"');
  });

  it("keeps the current 36px scale for the field and toggle", () => {
    expect(html).toMatch(/<input[^>]*class="[^"]*\bh-9\b/);
    expect(html).toMatch(/<button[^>]*class="[^"]*\bsize-9\b/);
  });

  it("keeps the localized field and toggle disabled while visible", () => {
    visibility.shown = true;
    const off = renderToStaticMarkup(<PasswordInput disabled showLabel="Show password" hideLabel="Hide password" />);
    expect(off).toMatch(/<input[^>]*type="text"[^>]*disabled=""/);
    expect(off).toMatch(/<button[^>]*disabled=""/);
    expect(off).toContain('aria-label="Hide password"');
    expect(off).toContain('aria-pressed="true"');
  });
});
