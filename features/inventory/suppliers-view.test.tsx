import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { expect, it } from "vitest";
import { AccessProvider } from "@/lib/access-boundary";
import { SuppliersView } from "./suppliers-view";
import { supplier } from "@/mocks/supplier-contract";
it("bảng NCC hiển thị tên/mã, mở bảng giá đúng NCC, không lộ UUID", () => {
  const html = renderToStaticMarkup(<AccessProvider value={{ plane: "company", root: "", actions: new Set(["inventory:supplier:read", "inventory:supplier:create"]) }}><SuppliersView initialPage={{ items: [supplier], next_cursor: "" }} /></AccessProvider>);
  expect(html).toContain("Gạo An Bình"); expect(html).toContain("NCC-GAO"); expect(html).toContain("Bảng giá");
  expect(html.replace(/<[^>]*>/g, " ")).not.toMatch(/[0-9a-f]{8}-[0-9a-f]{4}-/);
});
it("không có provider thì đóng quyền, không hiện nút tạo", () => {
  const html = renderToStaticMarkup(<SuppliersView />);
  expect(html).toContain('role="alert"'); expect(html).not.toContain(">Thêm nhà cung cấp<");
});
