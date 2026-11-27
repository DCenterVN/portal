import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { NextIntlClientProvider } from "next-intl";
import { expect, it, vi } from "vitest";
import messages from "@/messages/vi.json";
import { SupplierMaterialsView } from "./supplier-materials-view";
import type { PriceRow } from "./supplier-price-rows";

const row: PriceRow = { sku: "a", name: "Gạo tẻ", image: null, unit_price_vnd: 12000, uom: "KG", valid_to: "2026-12-31", expiring: false };
const base = { state: "ready" as const, rows: [row], drafts: 0, active: true, canUpdate: true, supplierId: "s1", onAdd: vi.fn(), onEdit: vi.fn(), onStatus: vi.fn(), onRetry: vi.fn() };
const html = (props: Partial<React.ComponentProps<typeof SupplierMaterialsView>>) => renderToStaticMarkup(<NextIntlClientProvider locale="vi" messages={messages}><SupplierMaterialsView {...base} {...props} /></NextIntlClientProvider>);
const text = (value: string) => value.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ");

it("mở dòng thấy nguyên liệu, giá kèm đơn vị và ngày áp dụng đến", () => {
  const out = text(html({}));
  expect(out).toContain("Nguyên liệu cung cấp"); expect(out).toContain("Gạo tẻ"); expect(out).toContain("12.000 ₫ / kg"); expect(out).toContain("31/12/2026");
  expect(out).toContain("Thêm giá nguyên liệu"); expect(out).toContain("Sửa thông tin"); expect(out).toContain("Ngừng hợp tác");
  expect(html({})).toContain('href="/inventory/suppliers/s1"'); expect(out).toContain("Lịch sử giá và nhập hàng");
});
it("sắp hết hạn có huy hiệu, không có thì không", () => {
  expect(text(html({ rows: [{ ...row, expiring: true }] }))).toContain("Sắp hết hạn");
  expect(text(html({}))).not.toContain("Sắp hết hạn");
});
it("rỗng có câu hướng dẫn và nút thêm giá", () => {
  const out = text(html({ rows: [] }));
  expect(out).toContain("Chưa có nguyên liệu nào có giá. Thêm giá để có giá tham khảo khi nhập hàng."); expect(out).toContain("Thêm giá nguyên liệu");
});
it("lỗi chỉ trong tầng hai, có thử lại", () => {
  const out = text(html({ state: "error", rows: [] }));
  expect(out).toContain("Thử lại"); expect(out).not.toContain("Chưa có nguyên liệu nào có giá");
});
it("đang tải lần đầu thì có Đang tải, đã có dòng thì không", () => {
  expect(text(html({ state: "loading", rows: [] }))).toContain("Đang tải");
  expect(text(html({}))).not.toContain("Đang tải");
});
it("đã ngừng hợp tác thì không có nút thêm giá và đổi thành Hợp tác lại", () => {
  const out = text(html({ active: false }));
  expect(out).not.toContain("Thêm giá nguyên liệu"); expect(out).toContain("Hợp tác lại");
});
it("có bảng giá nháp thì có dòng nhắc dẫn sang trang hồ sơ", () => {
  expect(text(html({ drafts: 2 }))).toContain("Có 2 bảng giá nháp chưa áp dụng");
});
it("không có quyền sửa thì ẩn các nút ghi", () => {
  const out = text(html({ canUpdate: false }));
  expect(out).not.toContain("Thêm giá nguyên liệu"); expect(out).not.toContain("Sửa thông tin"); expect(out).toContain("Lịch sử giá và nhập hàng");
});

it("ở màn nhỏ mỗi nguyên liệu là một khối xếp dọc, bảng chỉ hiện từ md", () => {
  const out = html({ rows: [{ ...row, expiring: true }] });
  const cards = out.match(/<ul[^>]*md:hidden[^>]*>.*?<\/ul>/s)?.[0] ?? "";
  expect(cards).toContain("Gạo tẻ"); expect(cards).toContain("12.000 ₫ / kg"); expect(cards).toContain("Áp dụng đến ngày 31/12/2026"); expect(cards).toContain("Sắp hết hạn");
  expect(out).toMatch(/<div[^>]*hidden md:block[^>]*><div[^>]*><table/);
});

it("tầng hai trong danh sách: nút thêm giá là nút viền, cả khi rỗng; hồ sơ không đổi", () => {
  for (const out of [html({}), html({ rows: [] })]) expect(out).not.toMatch(/bg-primary[^>]*>Thêm giá nguyên liệu/);
});
