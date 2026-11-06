// @vitest-environment node
import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { Save } from "lucide-react";
import { describe, expect, it } from "vitest";
import { ActionButton } from "./action-button";

describe("ActionButton", () => {
  it("while pending locks the button, shows the spinner and the pending label", () => {
    const markup = renderToStaticMarkup(<ActionButton pending pendingLabel="Đang lưu…" icon={Save}>Lưu</ActionButton>);

    expect(markup).toContain('disabled=""');
    expect(markup).toContain('aria-busy="true"');
    expect(markup).toContain("animate-spin");
    expect(markup).toContain("Đang lưu…");
    expect(markup).not.toContain(">Lưu<");
  });

  it("when idle renders the icon and the label, enabled", () => {
    const markup = renderToStaticMarkup(<ActionButton icon={Save}>Lưu</ActionButton>);

    expect(markup).not.toContain('disabled=""');
    expect(markup).not.toContain("aria-busy");
    expect(markup).not.toContain("animate-spin");
    expect(markup).toContain("<svg");
    expect(markup).toContain("Lưu");
  });
});
