import { describe, it, expect } from "vitest";
import React from "react";
import { PageShell, PageHeader } from "./page";

describe("Page Components", () => {
  it("PageShell creates a neutral container with standard class names", () => {
    const element = PageShell({
      children: React.createElement("div", null, "Test Content"),
      className: "custom-class",
    });

    expect(element).toBeDefined();
    expect(element.type).toBe("div");
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

  it("PageHeader allows long titles, badges and actions to wrap in a narrow viewport", () => {
    const element = PageHeader({ title: "Nhà cung cấp tên rất dài", badge: <span>Đang hợp tác</span>, actions: <button>Ngừng hợp tác</button> });
    const [heading, actions] = React.Children.toArray(element.props.children) as React.ReactElement<{ className: string }>[];
    expect(heading.props.className).toContain("min-w-0");
    expect(actions.props.className).toContain("flex-wrap");
    expect(actions.props.className).toContain("min-w-0");
  });
