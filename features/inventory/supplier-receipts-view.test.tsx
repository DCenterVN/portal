import React from "react";
import { NextIntlClientProvider } from "next-intl";
import messages from "@/messages/vi.json";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, expect, it, vi } from "vitest";
import { AccessProvider } from "@/lib/access-boundary";
import { supplier, supplierID } from "@/mocks/supplier-contract";
import { SupplierDetailContainer } from "./supplier-detail-container";
import { SupplierReceiptsContainer } from "./supplier-receipts-container";
import { SupplierReceiptsView, type SupplierReceiptsViewProps } from "./supplier-receipts-view";
import { getSupplierHistory } from "@/lib/api/supplier-history";

const harness = vi.hoisted(() => ({ enabled: false, effects: [] as (() => void | (() => void))[], setters: [] as ReturnType<typeof vi.fn>[] }));
vi.mock("react", async original => {
  const actual = await original<typeof React>();
  return { ...actual, useState: (initial: unknown) => {
    if (!harness.enabled) return actual.useState(initial);
    const setter = vi.fn(); harness.setters.push(setter); return [initial, setter];
  }, useEffect: (effect: () => void) => { if (harness.enabled) harness.effects.push(effect); else actual.useEffect(effect); } };
});
vi.mock("@/lib/access-boundary", async original => {
  const actual = await original<typeof import("@/lib/access-boundary")>();
  return { ...actual, useAccess: () => harness.enabled ? { can: () => true, root: "branch-a" } : actual.useAccess() };
});
vi.mock("@/lib/api/supplier-history", async original => ({ ...await original<typeof import("@/lib/api/supplier-history")>(), getSupplierHistory: vi.fn() }));
vi.mock("@/lib/api/supplier-agreements", async original => ({ ...await original<typeof import("@/lib/api/supplier-agreements")>(), getContractMaterials: vi.fn().mockResolvedValue([]) }));
afterEach(() => { harness.enabled = false; harness.effects = []; harness.setters = []; vi.clearAllMocks(); });
const props: SupplierReceiptsViewProps = { read: true, names: { [supplierID]: "Gạo tẻ" }, nameError: false, from: "", to: "", onFrom: vi.fn(), onTo: vi.fn(), hasPrevious: false, onPrevious: vi.fn(), onNext: vi.fn(), onRetry: vi.fn() };
const receipt = { id: supplierID, branch_ref: supplierID, supplier_ref: supplierID, status: "DRAFT", created_at: "2026-10-26T18:00:00Z", expected_at: "2026-10-27T01:00:00Z", completed_at: null, total_amount_vnd: 253,
  lines: [{ receipt_line_ref: supplierID, sku_ref: supplierID, uom: "KG", expected_quantity: "2.500", actual_quantity: "1.000", unit_cost_vnd: 101, expected_amount_vnd: 253, actual_amount_vnd: 101 }] };
const render = (changes: Partial<SupplierReceiptsViewProps> = {}) => renderToStaticMarkup(<SupplierReceiptsView {...props} {...changes} />);
it("deep link receipts mở đúng tab và lazy-load thay cho hồ sơ", () => {
  const html = renderToStaticMarkup(<NextIntlClientProvider locale="vi" messages={messages}><AccessProvider value={{ plane: "company", root: "", actions: new Set(["inventory:supplier:read"]) }}><SupplierDetailContainer supplierId={supplierID} initialSupplier={supplier} initialTab="receipts" /></AccessProvider></NextIntlClientProvider>);
  expect(html).toContain("Đang tải lịch sử nhập");
  expect(html).toMatch(/aria-selected="true"[^>]*>Lịch sử nhập/);
  expect(html).not.toContain("Mã số thuế");
});
it("nháp hiện ngày VN, lượng và thành tiền dự kiến từ snapshot", () => {
  const html = render({ page: { items: [receipt], total: 1, next_cursor: "next" } });
  expect(html).toContain("27/10/2026"); expect(html).toContain("Gạo tẻ"); expect(html).toContain("2,500"); expect(html).toContain("253");
  expect(html).toContain("Tổng dự kiến"); expect(html).not.toContain("Số lượng thực nhận");
});
it("phiếu nhận phân biệt dự kiến và thực nhận, không đoán giá legacy", () => {
  const html = render({ names: {}, page: { items: [{ ...receipt, status: "COMPLETED", total_amount_vnd: 101, lines: [{ ...receipt.lines[0], unit_cost_vnd: null }] }], total: 1, next_cursor: "" } });
  expect(html).toContain("Số lượng thực nhận"); expect(html).toContain("Thành tiền dự kiến"); expect(html).toContain("Thành tiền thực nhận");
  expect(html).toContain("1,000"); expect(html).toContain("Chưa có dữ liệu"); expect(html).toContain("Nguyên liệu đã ngừng hoặc chưa tải được tên");
  expect(html.replace(/<[^>]*>/g, " ")).not.toContain(supplierID);
});
it("loading, empty, lỗi và deny là trạng thái riêng", () => {
  expect(render()).toContain("Đang tải lịch sử nhập");
  expect(render({ page: { items: [], total: 0, next_cursor: "" } })).toContain("Chưa có phiếu nhập");
  expect(render({ failure: <p role="alert">Không tải được lịch sử</p> })).toContain("Không tải được lịch sử");
  expect(render({ read: false, page: { items: [receipt], total: 1, next_cursor: "" } })).not.toContain("Gạo tẻ");
});
it("đổi NCC hủy response cũ trước khi cập nhật state", async () => {
  let resolveOld!: (value: Awaited<ReturnType<typeof getSupplierHistory>>) => void;
  vi.mocked(getSupplierHistory).mockImplementationOnce(() => new Promise(resolve => { resolveOld = resolve; })).mockResolvedValueOnce({ items: [], total: 0, next_cursor: "" });
  harness.enabled = true;
  SupplierReceiptsContainer({ supplierId: supplierID });
  const cleanups = harness.effects.map(effect => effect());
  cleanups.forEach(cleanup => cleanup?.());
  harness.setters.forEach(setter => setter.mockClear());
  resolveOld({ items: [receipt], total: 1, next_cursor: "" });
  await Promise.resolve(); await Promise.resolve();
  expect(harness.setters.every(setter => setter.mock.calls.length === 0)).toBe(true);
  harness.effects = [];
  SupplierReceiptsContainer({ supplierId: "019a8000-0000-7000-8000-000000000002" });
  harness.effects.forEach(effect => effect());
  await Promise.resolve();
  expect(getSupplierHistory).toHaveBeenLastCalledWith("019a8000-0000-7000-8000-000000000002", { cursor: "", from: "", to: "" });
});
