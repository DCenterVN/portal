import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { PageHeading } from "./page-heading";

describe("PageHeading", () => {
  it("renders one h1 with description, badge and actions", () => {
    const html = renderToStaticMarkup(
      <PageHeading title="Chi tiết vận hành" description="Mô tả quản lý kho" badge={<span>Active</span>} actions={<button>Lưu</button>} />,
    );
    expect(html.match(/<h1\b/g)).toHaveLength(1);
    for (const text of ["Chi tiết vận hành", "Mô tả quản lý kho", "Active", "Lưu"]) expect(html).toContain(text);
  });

  it("lets long titles, badges and actions wrap on a narrow viewport", () => {
    const html = renderToStaticMarkup(<PageHeading title="Nhà cung cấp tên rất dài" actions={<button>Ngừng hợp tác</button>} />);
    expect(html).toContain("min-w-0 flex-1");
    expect(html).toContain("break-words");
    expect(html).toMatch(/class="flex min-w-0 flex-wrap items-center gap-3"/);
    expect(html).toContain("flex-col");
  });

  it("omits the actions and description slots when absent", () => {
    const html = renderToStaticMarkup(<PageHeading title="Tiêu đề" />);
    expect(html).not.toContain("<p");
    expect(html).not.toContain("flex-wrap items-center gap-3");
  });
});
