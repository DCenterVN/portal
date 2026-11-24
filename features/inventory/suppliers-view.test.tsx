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
const initial = { page: { total: 23, items: [{ ...supplier, material_category_labels: labels }], next_cursor: "n" }, key: supplierListKey(supplierTableState("")), categories: [{ code: "VEG", name: "Rau củ", children: [{ code: "LEAF", name: "Rau lá", children: [] as never[] }] }] };
const render = (actions: string[], value?: typeof initial) => renderToStaticMarkup(<NextIntlClientProvider locale="vi" messages={messages}><AccessProvider value={{ plane: "company", root: "", actions: new Set(actions) }}><SuppliersContainer initial={value} /></AccessProvider></NextIntlClientProvider>);

it("trang đầu dựng sẵn: tên, mã, tổng, nút nhóm lớn, nút thêm", () => {
  const html = render(["inventory:supplier:read", "inventory:supplier:create"], initial);
  const out = html.replace(/<[^>]*>/g, " ");
  for (const part of ["Gạo An Bình", "NCC-GAO", "Hiển thị 1–1 trong 23", "Rau củ", "Tất cả", "Nhóm A, Nhóm B, Nhóm C", "+2", "Thêm nhà cung cấp"]) expect(out).toContain(part);
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
});
