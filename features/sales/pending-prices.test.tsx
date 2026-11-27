import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { expect, it, vi } from "vitest";
import { PendingPricesCard } from "./pending-prices-card";
import { SalesOrderButtons } from "./orders-view";
import { paymentStatusLabels } from "./order-actions";
import { formatVND } from "@/lib/format";
import type { StaffOrder } from "@/lib/api/staff-orders";

const row = { id: "v1", price_book_id: "b1", product_name: "Cơm gà", variant_label: "2 suất", proposed_price_vnd: 90000, minimum_sale_price_vnd: 80000, created_at: "2026-11-12T03:00:00Z", authored_by_name: "", authored_by_is_me: false };
const pending = (items: typeof row[]) => ({ items, loading: false, error: "", reload: vi.fn(), page: 1, hasPrevious: false, hasNext: false, next: vi.fn(), previous: vi.fn() });

it("giá chờ duyệt hiện món, suất, giá, người đề xuất; ẩn Duyệt với giá của chính mình", () => {
  const html = renderToStaticMarkup(<PendingPricesCard pending={pending([row, { ...row, id: "v2", authored_by_is_me: true }])} busy={false} canApprove approve={vi.fn()} />);
  for (const text of ["Cơm gà", "2 suất", formatVND(90000), formatVND(80000), "Đồng nghiệp", "Bạn", "12/11/2026"]) expect(html).toContain(text);
  expect(html.match(/>Duyệt<\/button>/g)).toHaveLength(1);
  expect(html).not.toContain("b1");
});
it("không có quyền duyệt thì không có nút Duyệt", () => {
  expect(renderToStaticMarkup(<PendingPricesCard pending={pending([row])} busy={false} canApprove={false} approve={vi.fn()} />)).not.toContain(">Duyệt</button>");
});
it("đơn đã thu tiền chưa đóng gói huỷ được; giao hỏng có Giao lại; đang giao có Đổi người giao", () => {
  const base: StaffOrder = { id: "o", status: "CONFIRMED", payment_method: "BANK_TRANSFER", payment_status: "SUCCESS", total_vnd: 1, created_at: "2026-11-12" };
  const render = (order: StaffOrder) => renderToStaticMarkup(<SalesOrderButtons order={order} can={() => true} busy={false} act={vi.fn()} />);
  expect(render(base)).toContain(">Huỷ đơn</button>");
  expect(render({ ...base, status: "DELIVERY_FAILED" })).toContain(">Giao lại</button>");
  expect(render({ ...base, status: "DELIVERING" })).toContain(">Đổi người giao</button>");
  expect(render({ ...base, status: "DELIVERING" })).not.toContain(">Giao lại</button>");
  expect(paymentStatusLabels.REFUND_PENDING).toBe("Cần hoàn tiền");
});
