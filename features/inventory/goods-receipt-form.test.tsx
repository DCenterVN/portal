import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { expect, it } from "vitest";
import { AccessProvider } from "@/lib/access-boundary";
import { GoodsReceiptForm } from "./goods-receipt-form";
it("chưa tải coverage thì chặn tạo; không có ô nhập giá hay UUID", () => {
  const html = renderToStaticMarkup(<AccessProvider value={{ plane: "company", root: "", actions: new Set(["inventory:goods_receipt:create", "inventory:supplier:read"]) }}><GoodsReceiptForm /></AccessProvider>);
  expect(html).toContain("Giá hợp đồng"); expect(html).toContain("disabled");
  expect(html).not.toContain('name="unit_cost_vnd"'); expect(html).not.toContain('name="supplier_ref" type="text"');
});
it("thiếu action create thì đóng form", () => {
  expect(renderToStaticMarkup(<GoodsReceiptForm />)).toContain('role="alert"');
});
