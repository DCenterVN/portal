import React, { type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { expect, it, vi } from "vitest";
import { AccessProvider } from "@/lib/access-boundary";
import { agreement, supplierID } from "@/mocks/supplier-contract";
import { SupplierAgreementCard } from "./supplier-agreement-card";
import { SupplierAgreementContainer as SupplierAgreementForm } from "./supplier-agreement-container";
import { SupplierReceiptsView } from "./supplier-receipts-view";
import { overlapMessage } from "./use-supplier-agreement";

type SurfaceProps = { children?: ReactNode; open?: boolean };
vi.mock("@/components/ui/dialog", () => ({
  Dialog: ({ children, open }: SurfaceProps) => open ? children : null,
  DialogContent: ({ children }: SurfaceProps) => <section>{children}</section>,
  DialogTitle: ({ children }: SurfaceProps) => <h2>{children}</h2>,
  DialogDescription: ({ children }: SurfaceProps) => <p>{children}</p>,
  DialogFooter: ({ children }: SurfaceProps) => <footer>{children}</footer>,
}));
vi.mock("@/components/patterns/confirm-dialog", () => ({ ConfirmDialog: () => null }));
const noop = () => {};
const line = { ...agreement.lines[0], sku_ref: supplierID, uom: "KG", unit_price_vnd: 12000 };
const material = { id: supplierID, name: "Cá nục bỏ da", image_url: "https://img.test/ca.jpg" } as never;
function card(status: "ACTIVE" | "DRAFT" | "SUSPENDED", effective = status as string, update = true) {
  return renderToStaticMarkup(<SupplierAgreementCard agreement={{ ...agreement, status, effective_status: effective, lines: [line] }} materials={[material]} canUpdate={update} busy={false} onOpenDraft={noop} onSuspend={noop} onAttach={noop} onDownload={noop} />);
}
function form(value = agreement) {
  return renderToStaticMarkup(<AccessProvider value={{ plane: "company", root: "", actions: new Set(["inventory:supplier:update"]) }}><SupplierAgreementForm supplierId={supplierID} agreement={value} onClose={noop} onSaved={noop} onConflict={noop} /></AccessProvider>);
}

it("thẻ bảng giá: nhãn trạng thái tiếng Việt, tên và ảnh nguyên liệu, giá có đơn vị tiền", () => {
  const active = card("ACTIVE");
  expect(active).not.toContain("Đang áp dụng"); expect(active).toContain("Ngừng áp dụng"); expect(active).not.toContain("Ngừng dùng");
  expect(active).toContain("Cá nục bỏ da"); expect(active).toContain("https://img.test/ca.jpg"); expect(active).toContain("12.000 ₫"); expect(active).not.toContain("VND");
  expect(card("SUSPENDED")).toContain("Đã ngừng áp dụng"); expect(card("ACTIVE", "EXPIRED")).toContain("Hết hạn"); expect(card("DRAFT")).toContain("Nháp");
});
it("thẻ bảng giá: nút xếp ngang bên phải, không bọc nút trải hết bề ngang", () => {
  const html = card("ACTIVE");
  expect(html).toContain("justify-end"); expect(html).not.toMatch(/<button[^>]*class="[^"]*w-full/);
});
it("form bảng giá: không tiếng Anh, không câu kỹ thuật, nút tách rõ", () => {
  const html = form();
  expect(html).not.toContain("MiB"); expect(html).not.toContain("VND"); expect(html).not.toContain("Chưa lưu lên hệ thống");
  expect(html).not.toContain("Giá VND nguyên"); expect(html).not.toContain("Bỏ dòng giá");
  expect(html).toContain("Giá tham chiếu, giá thật nhập ở phiếu nhập");
  expect(html).toContain("Chọn tệp"); expect(html).toMatch(/type="file"[^>]*class="sr-only"|class="sr-only"[^>]*type="file"/);
  expect(html).toContain("Lưu nháp"); expect(html).toContain("Áp dụng bảng giá"); expect(html).toContain("justify-end");
});
it("câu trùng kỳ nói đúng việc, chỉ khi máy chủ báo trùng", () => {
  expect(overlapMessage("supplier price range overlap")).toContain("đang áp dụng");
  expect(overlapMessage("stale revision")).toBeUndefined();
});
it("lịch sử nhập: số dòng hàng, câu rỗng gọn, không chữ VND", () => {
  const receipt = { id: supplierID, branch_ref: supplierID, supplier_ref: supplierID, status: "COMPLETED", created_at: "2026-10-26T18:00:00Z", expected_at: "2026-10-27T01:00:00Z", completed_at: "2026-10-27T02:00:00Z", total_amount_vnd: 253,
    lines: [{ receipt_line_ref: supplierID, sku_ref: supplierID, uom: "KG", expected_quantity: "2.500", actual_quantity: "1.000", unit_cost_vnd: 101, expected_amount_vnd: 253, actual_amount_vnd: 101 }] };
  const props = { read: true, names: {}, nameError: false, from: "", to: "", onFrom: noop, onTo: noop, hasPrevious: false, onPrevious: noop, onNext: noop, onRetry: noop };
  const html = renderToStaticMarkup(<AccessProvider value={{ plane: "company", root: "", actions: new Set() }}><SupplierReceiptsView {...props} page={{ items: [receipt], total: 1, next_cursor: "" }} /></AccessProvider>);
  expect(html).not.toContain("goods-receipts"); expect(html).toContain("1 dòng hàng"); expect(html).not.toContain("VND");
  const empty = renderToStaticMarkup(<SupplierReceiptsView {...props} page={{ items: [], total: 0, next_cursor: "" }} />);
  expect(empty).toContain("Chưa nhập lần nào từ nhà cung cấp này");
});
