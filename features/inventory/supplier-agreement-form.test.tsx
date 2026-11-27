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
}));
vi.mock("@/components/patterns/confirm-dialog", () => ({ ConfirmDialog: () => null }));
const noop = () => {};
function markup(value: Agreement = agreement, update = true) {
  return renderToStaticMarkup(<AccessProvider value={{ plane: "company", root: "", actions: new Set(update ? ["inventory:supplier:update"] : []) }}><SupplierAgreementForm supplierId={supplierID} agreement={value} onClose={noop} onSaved={noop} onConflict={noop} /></AccessProvider>);
}
it("nháp server có nhãn rõ, editor theo hàng và lưu/áp dụng tách biệt", () => {
  const html = markup();
  expect(html).toContain("Sửa bản nháp bảng giá");
  expect(html).toContain("Các dòng bảng giá");
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

it("nháp không có chứng từ vẫn có Áp dụng, hướng dẫn file là tùy chọn", () => {
  const html = markup({ ...agreement, document_ref: null });
  expect(html).toContain("Áp dụng bảng giá");
  expect(html).toContain("Chứng từ (không bắt buộc)");
  expect(html).not.toContain("Cần một chứng từ đã hoàn tất trước khi áp dụng");
});

const create = () => renderToStaticMarkup(<AccessProvider value={{ plane: "company", root: "", actions: new Set(["inventory:supplier:update"]) }}><SupplierAgreementForm supplierId={supplierID} supplierCode="NCC1" onClose={noop} onSaved={noop} onConflict={noop} /></AccessProvider>);
it("nhãn giá đi qua uomLabel", () => {
  expect(markup()).toContain("Giá (₫ mỗi kg)");
});
it("lập mới để trống ngày đến, nhắc dưới ô và khoá nút lưu; sửa nháp giữ ngày đã lưu", () => {
  const html = create();
  expect(html).toContain("Chọn ngày kết thúc áp dụng"); expect(html).toMatch(/<button[^>]*disabled=""[^>]*>Lưu nháp/);
  expect(markup()).not.toContain("Chọn ngày kết thúc áp dụng");
});
