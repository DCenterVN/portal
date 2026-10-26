import React, { type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { expect, it, vi } from "vitest";
import { AccessProvider } from "@/lib/access-boundary";
import { SupplierAgreementContainer as SupplierAgreementForm } from "./supplier-agreement-container";
import { type Agreement } from "@/lib/api/supplier-agreements";
import { agreement, supplierID } from "@/mocks/supplier-contract";

type SurfaceProps = { children?: ReactNode; open?: boolean };
vi.mock("@/components/ui/dialog", () => ({
  Dialog: ({ children, open }: SurfaceProps) => open ? children : null,
  DialogContent: ({ children }: SurfaceProps) => <section>{children}</section>,
  DialogTitle: ({ children }: SurfaceProps) => <h2>{children}</h2>,
  DialogDescription: ({ children }: SurfaceProps) => <p>{children}</p>,
  ConfirmDialog: () => null,
}));
const noop = () => {};
function markup(value: Agreement = agreement, update = true) {
  return renderToStaticMarkup(<AccessProvider value={{ plane: "company", root: "", actions: new Set(update ? ["inventory:supplier:update"] : []) }}><SupplierAgreementForm supplierId={supplierID} agreement={value} onClose={noop} onSaved={noop} onConflict={noop} /></AccessProvider>);
}
it("nháp server có nhãn rõ, editor theo hàng và lưu/áp dụng tách biệt", () => {
  const html = markup();
  expect(html).toContain("Sửa bản nháp bảng giá");
  expect(html).toContain("Đã lưu nháp phiên bản 1");
  expect(html).toContain('<table');
  expect(html).toContain("Lưu nháp");
  expect(html).toContain("Áp dụng bảng giá");
  expect(html).not.toContain("2. Chứng từ");
});
it("ACTIVE hoặc thiếu quyền không có input giá và action lưu", () => {
  for (const html of [markup({ ...agreement, status: "ACTIVE" }), markup(agreement, false)]) {
    expect(html).toContain('role="alert"');
    expect(html).not.toContain('name="unit_price_vnd"');
    expect(html).not.toContain(">Lưu nháp<");
  }
});
