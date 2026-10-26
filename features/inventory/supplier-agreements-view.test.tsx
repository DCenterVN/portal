import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { expect, it } from "vitest";
import { AccessProvider } from "@/lib/access-boundary";
import { SupplierAgreementsView } from "./supplier-agreements-view";
import { agreement, supplierID } from "@/mocks/supplier-contract";
it("ACTIVE chỉ Ngừng dùng và Lập hợp đồng mới, không có editor sửa giá", () => {
  const html = renderToStaticMarkup(<AccessProvider value={{ plane: "company", root: "", actions: new Set(["inventory:supplier:read", "inventory:supplier:update"]) }}><SupplierAgreementsView supplierId={supplierID} initialItems={[{ ...agreement, status: "ACTIVE", effective_status: "ACTIVE" }]} /></AccessProvider>);
  expect(html).toContain("Ngừng dùng"); expect(html).toContain("Lập hợp đồng mới"); expect(html).not.toContain("Lưu nháp"); expect(html).not.toContain('name="unit_price_vnd"');
});
it("SUSPENDED không mở lại; read-only không có action áp dụng", () => {
  const html = renderToStaticMarkup(<AccessProvider value={{ plane: "company", root: "", actions: new Set(["inventory:supplier:read"]) }}><SupplierAgreementsView supplierId={supplierID} initialItems={[{ ...agreement, status: "SUSPENDED", status_reason: "Ngừng hợp tác" }]} /></AccessProvider>);
  expect(html).toContain("Ngừng hợp tác"); expect(html).not.toContain(">Áp dụng bảng giá<"); expect(html).not.toContain(">Lập hợp đồng mới<");
});
