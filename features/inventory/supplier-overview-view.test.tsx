import React from "react";
import type { Route } from "next";
import { renderToStaticMarkup } from "react-dom/server";
import { expect, it, vi } from "vitest";
import { SupplierOverviewStrip } from "./supplier-overview-view";
import type { SupplierOverview } from "@/lib/api/supplier-overview";
import { supplierID, materialID } from "@/mocks/supplier-contract";

const full: SupplierOverview = {
  as_of: "2026-11-16T03:00:00Z",
  suppliers: { active: 12, suspended: 3 },
  price_coverage: { suppliers_with_active_price: 9, suppliers_without_active_price: 7, materials_priced: 41 },
  agreements: { draft: 2, expiring_within_14_days: 6 },
  receipts: { last_30_days: 18, last_received_at: "2026-11-14T08:00:00Z" },
  attention: {
    expiring: [{ supplier_id: supplierID, supplier_name: "Gạo An Bình", agreement_code: "HD-GAO", valid_to: "2026-11-20" }],
    without_price: [{ supplier_id: materialID, supplier_name: "Rau củ Tân Phú" }],
  },
};

const baseProps: React.ComponentProps<typeof SupplierOverviewStrip> = {
  overview: full,
  loading: false,
  error: "",
  onRetry: vi.fn(),
  pricedToday: false,
  pricedHref: "/inventory/suppliers?f.priced=today" as Route,
  withoutPriceHref: "/inventory/suppliers?f.attention=without_price" as Route,
  expiringHref: "/inventory/suppliers?f.attention=expiring" as Route,
  closeAttentionHref: "/inventory/suppliers" as Route,
  attention: "",
};

const render = (props: Partial<React.ComponentProps<typeof SupplierOverviewStrip>> = {}) =>
  renderToStaticMarkup(<SupplierOverviewStrip {...baseProps} {...props} />);
const text = (html: string) => html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ");

it("ba thẻ KPI là Link đồng nhất với href riêng", () => {
  const html = render();
  for (const label of ["Có giá hiệu lực", "Chưa có giá", "Giá sắp hết hạn"]) expect(text(html)).toContain(label);
  expect(html).toContain('href="/inventory/suppliers?f.priced=today"');
  expect(html).toContain('href="/inventory/suppliers?f.attention=without_price"');
  expect(html).toContain('href="/inventory/suppliers?f.attention=expiring"');
  expect(html).not.toContain("<button");
});

it("mở khay without_price hiện danh sách có nút Thêm giá nguyên liệu", () => {
  const html = render({ attention: "without_price" });
  expect(html).toContain('aria-current="true"');
  expect(text(html)).toContain("Rau củ Tân Phú");
  expect(text(html)).toContain("Thêm giá nguyên liệu");
  expect(html).toContain(`/inventory/suppliers/${materialID}/prices/new`);
  expect(html).toContain('aria-label="Đóng danh sách chưa có giá"');
});

it("mở khay expiring hiện ngày hết hạn", () => {
  const html = render({ attention: "expiring" });
  expect(html).toContain('aria-current="true"');
  expect(text(html)).toContain("Gạo An Bình");
  expect(text(html)).toContain("Hết hạn 20/11/2026");
  expect(html).toContain(`/inventory/suppliers/${supplierID}`);
  expect(html).toContain('aria-label="Đóng danh sách giá sắp hết hạn"');
});

it("khay rỗng vẫn mở và hiện thông báo không có nhà cung cấp", () => {
  const emptyOverview: SupplierOverview = { ...full, attention: { expiring: [], without_price: [] } };
  expect(text(render({ overview: emptyOverview, attention: "without_price" }))).toContain("Không có nhà cung cấp nào trong mục này.");
  expect(text(render({ overview: emptyOverview, attention: "expiring" }))).toContain("Không có nhà cung cấp nào trong mục này.");
});

it("đang tải hiện skeleton và lỗi hiện thông báo kèm nút Thử lại", () => {
  const loadingHtml = render({ overview: undefined, loading: true });
  expect(loadingHtml).toContain('data-slot="skeleton"');
  const errorHtml = render({ overview: undefined, error: "Hỏng" });
  expect(errorHtml).toContain('role="alert"');
  expect(text(errorHtml)).toContain("Hỏng");
  expect(text(errorHtml)).toContain("Thử lại");
});
