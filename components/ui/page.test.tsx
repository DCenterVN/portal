import { describe, it, expect } from "vitest";
import React from "react";
import { PageShell } from "./page";

describe("PageShell", () => {
  it("creates a neutral container with standard class names", () => {
    const element = PageShell({
      children: React.createElement("div", null, "Test Content"),
      className: "custom-class",
    });

    expect(element.type).toBe("div");
    expect(element.props.className).toContain("mx-auto w-full max-w-7xl in-data-[surface=store]:py-8");
    expect(element.props.className).toContain("custom-class");
  });
});
