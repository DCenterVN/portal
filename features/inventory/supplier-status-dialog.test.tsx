import React from "react";
import { NextIntlClientProvider } from "next-intl";
import messages from "@/messages/vi.json";
import { renderToStaticMarkup } from "react-dom/server";
import { expect, it, vi } from "vitest";
import { AccessProvider } from "@/lib/access-boundary";
import { SupplierDetailContainer as SupplierDetailView } from "./supplier-detail-container";
import { supplier, supplierID } from "@/mocks/supplier-contract";

vi.mock("@/components/patterns/confirm-dialog", () => ({
  ConfirmDialog: ({ open, title, description, confirmLabel, children }: { open: boolean; title: string; description: string; confirmLabel: string; children: React.ReactNode }) => open ? <div role="alertdialog"><h2>{title}</h2><p>{description}</p>{children}<button>{confirmLabel}</button></div> : null,
}));
it("hộp thoại ngừng hợp tác nêu đúng việc, có ô chọn lý do và nút mang tên việc", () => {
  const html = renderToStaticMarkup(<NextIntlClientProvider locale="vi" messages={messages}><AccessProvider value={{ plane: "company", root: "", actions: new Set(["inventory:supplier:read", "inventory:supplier:update"]) }}><SupplierDetailView supplierId={supplierID} initialSupplier={supplier} initialStatusDialog /></AccessProvider></NextIntlClientProvider>);
  expect(html).toContain("Ngừng hợp tác với Gạo An Bình?");
  expect(html).toContain("Chất lượng hàng không đạt"); expect(html).toContain("Ngừng kinh doanh");
  expect(html).not.toContain("Xác nhận thay đổi");
});
it("hộp thoại hợp tác lại nêu đúng việc", () => {
  const html = renderToStaticMarkup(<NextIntlClientProvider locale="vi" messages={messages}><AccessProvider value={{ plane: "company", root: "", actions: new Set(["inventory:supplier:read", "inventory:supplier:update"]) }}><SupplierDetailView supplierId={supplierID} initialSupplier={{ ...supplier, status: "SUSPENDED" }} initialStatusDialog /></AccessProvider></NextIntlClientProvider>);
  expect(html).toContain("Hợp tác lại với Gạo An Bình?");
  expect(html).not.toContain("Chất lượng hàng không đạt");
});
