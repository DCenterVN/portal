import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { expect, it } from "vitest";
import { AccessProvider } from "@/lib/access-boundary";
import { SupplierAgreementsContainer as SupplierAgreementsView } from "./supplier-agreements-container";
import { agreement, supplierID } from "@/mocks/supplier-contract";
it("ACTIVE chỉ Ngừng dùng và Lập bảng giá mới, không có editor sửa giá", () => {
  const html = renderToStaticMarkup(<AccessProvider value={{ plane: "company", root: "", actions: new Set(["inventory:supplier:read", "inventory:supplier:update"]) }}><SupplierAgreementsView supplierId={supplierID} initialItems={[{ ...agreement, status: "ACTIVE", effective_status: "ACTIVE" }]} /></AccessProvider>);
  expect(html).toContain("Ngừng dùng"); expect(html).toContain("Lập bảng giá mới"); expect(html).not.toContain("Lưu nháp"); expect(html).not.toContain('name="unit_price_vnd"');
});
it("SUSPENDED không mở lại; read-only không có action áp dụng", () => {
  const html = renderToStaticMarkup(<AccessProvider value={{ plane: "company", root: "", actions: new Set(["inventory:supplier:read"]) }}><SupplierAgreementsView supplierId={supplierID} initialItems={[{ ...agreement, status: "SUSPENDED", status_reason: "Ngừng hợp tác" }]} /></AccessProvider>);
  expect(html).toContain("Ngừng hợp tác"); expect(html).not.toContain(">Áp dụng bảng giá<"); expect(html).not.toContain(">Lập bảng giá mới<");
});
it("bảng giá nhiều dòng hiển thị ngày VN và chứng từ gọn", () => {
  const html = renderToStaticMarkup(<AccessProvider value={{ plane: "company", root: "", actions: new Set(["inventory:supplier:read"]) }}><SupplierAgreementsView supplierId={supplierID} initialItems={[{ ...agreement, document_ref: null, lines: [...agreement.lines, { ...agreement.lines[0], uom: "G", unit_price_vnd: 50 }] }]} /></AccessProvider>);
  expect(html).toContain("Bảng giá tham chiếu");
  expect(html).toContain("01/11/2026");
  expect(html).toContain("Chưa có chứng từ");
  expect(html).toContain("Nháp");
  expect(html).toContain("25.000");
  expect(html).not.toContain("Chứng từ chính");
});
