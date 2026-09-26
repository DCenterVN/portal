import { describe, it, expect } from "vitest";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { PasswordInput } from "./password-input";

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
    expect(html).toMatch(/<button[^>]*class="[^"]*\bsize-10\b/);
  });

  it("disables the toggle with the field", () => {
    const off = renderToStaticMarkup(<PasswordInput name="password" disabled />);
    expect(off.match(/disabled=""/g)).toHaveLength(2);
  });
});
