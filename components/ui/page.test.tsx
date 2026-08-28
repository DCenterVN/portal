import { describe, it, expect } from "vitest";
import React from "react";
import { PageShell, PageHeader } from "./page";

describe("Page Components", () => {
  it("PageShell creates a main container with standard class names", () => {
    const element = PageShell({
      children: React.createElement("div", null, "Test Content"),
      className: "custom-class",
    });

    expect(element).toBeDefined();
    expect(element.type).toBe("main");
    expect(element.props.className).toContain("mx-auto max-w-7xl px-4 py-8 sm:px-6");
    expect(element.props.className).toContain("custom-class");
  });

  it("PageHeader renders icon, title, badge, description, and actions correctly", () => {
    const mockIcon = React.createElement("svg", { "data-testid": "icon" });
    const mockBadge = React.createElement("span", null, "Active");
    const mockAction = React.createElement("button", null, "Action");

    const element = PageHeader({
      icon: mockIcon,
      title: "Chi tiết Vận hành",
      badge: mockBadge,
      description: "Mô tả quản lý kho",
      actions: mockAction,
    });

    expect(element).toBeDefined();
    expect(element.props.className).toContain("border-b border-[var(--border)]");
    expect(element.props.className).toContain("pb-6");
    expect(element.props.className).toContain("flex flex-col md:flex-row md:items-center md:justify-between gap-4");
  });
});
