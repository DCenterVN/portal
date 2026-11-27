import React from "react";
import { NextIntlClientProvider } from "next-intl";
import { renderToStaticMarkup } from "react-dom/server";
import { expect, it, vi } from "vitest";
import messages from "@/messages/vi.json";
import { AccessProvider } from "@/lib/access-boundary";
import { supplier } from "@/mocks/supplier-contract";
import { SuppliersContainer } from "./suppliers-container";
import { supplierListKey, supplierTableState } from "./suppliers-table";
import { groupLabels } from "./suppliers-view";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn(), replace: vi.fn() }), usePathname: () => "/inventory/suppliers", useSearchParams: () => new URLSearchParams("") }));
const labels = ["A", "B", "C", "D", "E"].map(name => ({ code: name, name: `Nhóm ${name}` }));
const overview = {
  as_of: "2026-11-16T03:00:00Z",
  suppliers: { active: 12, suspended: 3 },
  price_coverage: { suppliers_with_active_price: 9, suppliers_without_active_price: 7, materials_priced: 41 },
  agreements: { draft: 2, expiring_within_14_days: 6 },
  receipts: { last_30_days: 18, last_received_at: "2026-11-14T08:00:00Z" },
  attention: { expiring: [], without_price: [] },
};
const initial = {
  page: { total: 23, items: [{ ...supplier, material_category_labels: labels }], next_cursor: "n" },
  key: supplierListKey(supplierTableState("")),
  categories: [
    { code: "CA", name: "Cá", children: [{ code: "CA_NUOC_NGOT", name: "Cá nước ngọt", children: [] as never[] }] },
    { code: "THIT", name: "Thịt", children: [{ code: "THIT_HEO", name: "Thịt heo", children: [] as never[] }] },
    { code: "VEG", name: "Rau củ", children: [{ code: "LEAF", name: "Rau lá", children: [] as never[] }] },
  ],
  overview,
};
const render = (actions: string[], value?: typeof initial) => renderToStaticMarkup(<NextIntlClientProvider locale="vi" messages={messages}><AccessProvider value={{ plane: "company", root: "", actions: new Set(actions) }}><SuppliersContainer initial={value} /></AccessProvider></NextIntlClientProvider>);

it("trang đầu dựng sẵn: tên, không lộ mã thô, tổng, nhóm thực phẩm, dải số tổng quan, nút thêm", () => {
  const html = render(["inventory:supplier:read", "inventory:supplier:create"], initial);
  const out = html.replace(/<[^>]*>/g, " ");
  for (const part of ["Gạo An Bình", "Hiển thị 1–1 trong 23", "Rau củ", "Tất cả", "Nhóm A, Nhóm B, Nhóm C", "+2", "Thêm nhà cung cấp", "Có giá hiệu lực", "Chưa có giá", "Giá sắp hết hạn"]) expect(out).toContain(part);
  expect(out).not.toContain("NCC-GAO");
  expect(out.indexOf("Thịt")).toBeLessThan(out.indexOf("Cá"));
  expect(html).toContain('href="/inventory/suppliers?f.priced=today"');
  expect(html).toContain('aria-label="Số trang"');
  expect(out).toMatch(/trên\s+3/);
  expect(html).toContain("Tới trang cuối");
  expect(out).not.toMatch(/[0-9a-f]{8}-[0-9a-f]{4}-/);
});
it("không có quyền và không có dữ liệu dựng sẵn thì đóng", () => {
  expect(render([])).toContain('role="alert"');
});
it("tối đa ba nhãn rồi cộng n", () => {
  expect(groupLabels({ ...supplier, material_category_labels: labels } as never)).toEqual({ shown: ["Nhóm A", "Nhóm B", "Nhóm C"], more: 2 });
});
it("khoá dữ liệu đổi theo địa chỉ", () => {
  expect(supplierListKey(supplierTableState("f.category=LEAF&size=20&sort=-name"))).toContain("category_code=LEAF");
  expect(supplierListKey(supplierTableState("f.priced=today"))).toContain("priced_on=");
});
