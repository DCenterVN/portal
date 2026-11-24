import React, { type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { NextIntlClientProvider } from "next-intl";
import { expect, it, vi } from "vitest";
import messages from "@/messages/vi.json";
import { AccessProvider } from "@/lib/access-boundary";
import { agreement, supplier, supplierID } from "@/mocks/supplier-contract";
import { SupplierAgreementCard } from "./supplier-agreement-card";
import { SupplierAgreementContainer } from "./supplier-agreement-container";
import { SupplierCategoryPicker } from "./supplier-category-picker";
import { SupplierPricesTab } from "./supplier-prices-tab";
import { SupplierDetailContainer } from "./supplier-detail-container";
import { SupplierMaterialsView } from "./supplier-materials-view";
import { agreementCode } from "./use-supplier-agreement";

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
const access = (...actions: string[]) => ({ plane: "company" as const, root: "", actions: new Set(actions) });
const line = { ...agreement.lines[0], sku_ref: supplierID, uom: "KG", unit_price_vnd: 12000 };
const card = (status: "ACTIVE" | "DRAFT" | "SUSPENDED") => renderToStaticMarkup(<SupplierAgreementCard agreement={{ ...agreement, status, effective_status: status, lines: [line] }} materials={[]} canUpdate busy={false} onOpenDraft={noop} onSuspend={noop} onAttach={noop} onDownload={noop} />);
const newForm = (code?: string) => renderToStaticMarkup(<AccessProvider value={access("inventory:supplier:update")}><SupplierAgreementContainer supplierId={supplierID} supplierCode={code} onClose={noop} onSaved={noop} onConflict={noop} /></AccessProvider>);

it("thẻ bảng giá: không hiện huy hiệu Đang áp dụng, nháp vẫn hiện, đơn vị qua uomLabel", () => {
  expect(card("ACTIVE")).not.toContain("Đang áp dụng");
  expect(card("DRAFT")).toContain("Nháp");
  expect(card("ACTIVE")).toContain("12.000 ₫ / kg");
  expect(card("ACTIVE")).not.toContain("KG");
});
it("mã gợi ý theo mã nhà cung cấp và ngày dạng ngày tháng năm hai chữ số", () => {
  expect(agreementCode("NCC-GAO", "2026-11-16")).toBe("BG-NCC-GAO-161126");
  expect(agreementCode(undefined, "2026-11-16")).toBe("");
});
it("form lập mới: tiêu đề Thêm giá nguyên liệu, mã điền sẵn, một chỗ báo tải, phần gập dùng Collapsible", () => {
  const html = newForm("NCC-GAO");
  expect(html).toContain("Thêm giá nguyên liệu");
  expect(html).not.toContain("Lập bảng giá mới");
  expect(html).toMatch(/value="BG-NCC-GAO-\d{6}"/);
  expect(html.match(/Đang tải nguyên liệu/g)?.length ?? 0).toBeLessThanOrEqual(1);
  expect(html).not.toContain("<details");
  expect(html).toContain("Ngày áp dụng riêng, thuế và giao hàng");
  expect(html).toContain('data-slot="collapsible"');
});
const tree = [{ code: "RAU", name: "Rau", children: [{ code: "CAI", name: "Cải" }, { code: "MUOP", name: "Mướp" }] }] as never;
it("nhóm đã chọn là thẻ xếp ngang có nút bỏ", () => {
  const html = renderToStaticMarkup(<NextIntlClientProvider locale="vi" messages={messages}><SupplierCategoryPicker categories={tree} selected={["CAI", "MUOP"]} onChange={noop} /></NextIntlClientProvider>);
  expect(html).toContain('aria-label="Nhóm đã chọn"');
  expect(html).toContain('aria-label="Bỏ nhóm Cải"');
  expect(html).toContain('aria-label="Bỏ nhóm Mướp"');
  expect(html).toMatch(/<ul[^>]*flex-wrap/);
});
it("tầng hai ở hồ sơ ẩn hàng nút quản lý", () => {
  const html = renderToStaticMarkup(<SupplierMaterialsView profile state="ready" rows={[]} drafts={2} active canUpdate supplierId={supplierID} onAdd={noop} onEdit={noop} onStatus={noop} onRetry={noop} />);
  expect(html).not.toContain("Sửa thông tin"); expect(html).not.toContain("Lịch sử giá và nhập hàng"); expect(html).not.toContain("Xem bảng giá nháp");
});
it("hồ sơ: tab đầu là Nguyên liệu và giá, có tầng hai, rồi mục Các bảng giá", () => {
  const html = renderToStaticMarkup(<NextIntlClientProvider locale="vi" messages={messages}><AccessProvider value={access("inventory:supplier:read")}><SupplierDetailContainer supplierId={supplierID} initialSupplier={supplier}><SupplierPricesTab supplier={supplier} canUpdate={false} read /></SupplierDetailContainer></AccessProvider></NextIntlClientProvider>);
  expect(html).toContain(">Nguyên liệu và giá<");
  expect(html).not.toContain(">Bảng giá<");
  expect(html.indexOf('aria-label="Nguyên liệu cung cấp"')).toBeGreaterThan(0);
  expect(html.indexOf('aria-label="Nguyên liệu cung cấp"')).toBeLessThan(html.indexOf("Các bảng giá"));
});

const head = (status: "ACTIVE" | "SUSPENDED") => renderToStaticMarkup(<NextIntlClientProvider locale="vi" messages={messages}><AccessProvider value={access("inventory:supplier:read", "inventory:supplier:update")}><SupplierDetailContainer supplierId={supplierID} initialSupplier={{ ...supplier, status }} /></AccessProvider></NextIntlClientProvider>);
it("12k2b: nút chính đầu hồ sơ là Thêm giá nguyên liệu; huy hiệu chỉ hiện khi ngừng hợp tác", () => {
  const active = head("ACTIVE");
  expect(active).toContain(">Thêm giá nguyên liệu<");
  expect(active).not.toContain(">Thêm bảng giá<");
  expect(active).not.toContain("Đang hợp tác");
  expect(head("SUSPENDED")).toContain("Ngừng hợp tác");
});
it("12k2b: dòng nguyên liệu trong thẻ bảng giá không có ô ảnh trống, hiện chữ cái đầu", () => {
  const html = renderToStaticMarkup(<SupplierAgreementCard agreement={{ ...agreement, status: "ACTIVE", effective_status: "ACTIVE", lines: [line] }} materials={[{ id: supplierID, name: "Tỏi S13" } as never]} canUpdate busy={false} onOpenDraft={noop} onSuspend={noop} onAttach={noop} onDownload={noop} />);
  expect(html).toContain(">T</span>");
  expect(html).not.toMatch(/<span aria-hidden="true" class="size-9[^>]*><\/span>/);
});
it("12k2b: phần gập ngày áp dụng riêng mặc định đóng", () => {
  const html = newForm("NCC-GAO");
  expect(html).toMatch(/data-state="closed"[^>]*data-slot="collapsible"|data-slot="collapsible"[^>]*data-state="closed"/);
  expect(html).not.toMatch(/data-slot="collapsible"[^>]*data-state="open"|data-state="open"[^>]*data-slot="collapsible"/);
});
