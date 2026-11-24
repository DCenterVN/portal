import React from "react";
import { NextIntlClientProvider } from "next-intl";
import { renderToStaticMarkup } from "react-dom/server";
import { expect, it, vi } from "vitest";
import messages from "@/messages/vi.json";
import { SupplierOverviewView } from "./supplier-overview-view";
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
const render = (props: Partial<React.ComponentProps<typeof SupplierOverviewView>>) => renderToStaticMarkup(<NextIntlClientProvider locale="vi" messages={messages}><SupplierOverviewView overview={full} loading={false} error="" onRetry={vi.fn()} {...props} /></NextIntlClientProvider>);
const text = (html: string) => html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ");

it("bốn số có nhãn; hai số trạng thái là link sang danh sách đã lọc", () => {
  const html = render({});
  for (const label of ["Đang hợp tác", "Ngừng hợp tác", "Chưa có giá", "Giá sắp hết hạn"]) expect(text(html)).toContain(label);
  expect(html).toContain('href="/inventory/suppliers?f.status=ACTIVE"'); expect(html).toContain('href="/inventory/suppliers?f.status=SUSPENDED"');
  expect(html).not.toContain("<button");
});
it("luôn liệt kê nhà chưa có giá và giá sắp hết hạn", () => {
  const html = render({});
  expect(text(html)).toContain("Rau củ Tân Phú"); expect(text(html)).toContain("Gạo An Bình"); expect(text(html)).toContain("20/11/2026");
  expect(html).toContain(`/inventory/suppliers/${materialID}/prices/new`); expect(html).toContain(`/inventory/suppliers/${supplierID}`);
});
it("đang tải và lỗi có trạng thái riêng", () => {
  expect(render({ overview: undefined, loading: true })).toContain("role=\"status\"");
  expect(render({ overview: undefined, error: "Hỏng" })).toContain("Hỏng");
});
