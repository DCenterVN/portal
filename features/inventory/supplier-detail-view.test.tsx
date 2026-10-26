import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { expect, it } from "vitest";
import { AccessProvider } from "@/lib/access-boundary";
import { SupplierDetailContainer as SupplierDetailView } from "./supplier-detail-container";
import { supplier, supplierID } from "@/mocks/supplier-contract";
it("detail có thông tin NCC và tab hợp đồng; read không mở mutation", () => {
  const html = renderToStaticMarkup(<AccessProvider value={{ plane: "company", root: "", actions: new Set(["inventory:supplier:read"]) }}><SupplierDetailView supplierId={supplierID} initialSupplier={supplier} /></AccessProvider>);
  expect(html).toContain("Gạo An Bình"); expect(html).toContain("Bảng giá"); expect(html).not.toContain(">Sửa thông tin<");
});
it("hồ sơ có ảnh chữ đầu, mã, nhóm cũ, địa chỉ và liên hệ đúng dữ liệu", () => {
  const html = renderToStaticMarkup(<AccessProvider value={{ plane: "company", root: "", actions: new Set(["inventory:supplier:read"]) }}><SupplierDetailView supplierId={supplierID} initialSupplier={{ ...supplier, address: "12 Nguyễn Trãi", material_categories: [supplierID] }} /></AccessProvider>);
  expect(html).toContain("Ảnh nhà cung cấp Gạo An Bình");
  expect(html).toContain("Mã nhà cung cấp");
  expect(html).toContain("Nhóm cũ cần chọn lại");
  expect(html).toContain("12 Nguyễn Trãi");
  expect(html).toContain("Chưa có thông tin liên hệ");
  expect(html.replace(/<[^>]*>/g, " ")).not.toMatch(/[0-9a-f]{8}-[0-9a-f]{4}-/);
});
