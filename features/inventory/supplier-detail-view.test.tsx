import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { expect, it } from "vitest";
import { AccessProvider } from "@/lib/access-boundary";
import { SupplierDetailView } from "./supplier-detail-view";
import { supplier, supplierID } from "@/mocks/supplier-contract";
it("detail có thông tin NCC và tab hợp đồng; read không mở mutation", () => {
  const html = renderToStaticMarkup(<AccessProvider value={{ plane: "company", root: "", actions: new Set(["inventory:supplier:read"]) }}><SupplierDetailView supplierId={supplierID} initialSupplier={supplier} /></AccessProvider>);
  expect(html).toContain("Gạo An Bình"); expect(html).toContain("Hợp đồng"); expect(html).not.toContain(">Sửa thông tin<");
});
