import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { expect, it, vi } from "vitest";
import { SalesOrderButtons } from "./orders-view";
import type { StaffOrder } from "@/lib/api/staff-orders";
import { orderActions, reservationLabels } from "./order-actions";
import { consoleNavFor, consoleRouteAllowed } from "@/lib/navigation";
import { isEmployeeRoute } from "@/lib/fetcher";

it.each([
  ["AWAITING_PAYMENT", ["Xác nhận đơn", "Huỷ đơn"], ["Xác nhận đã nhận tiền", "Huỷ đơn"]],
  ["CONFIRMED", ["Đóng gói", "Huỷ đơn"], ["Đóng gói", "Huỷ đơn"]],
  ["PACKED", ["Giao đơn"], ["Giao đơn"]],
  ["DELIVERING", ["Đã giao", "Giao thất bại", "Đổi người giao"], ["Đã giao", "Giao thất bại", "Đổi người giao"]],
  ["DELIVERY_FAILED", ["Giao lại"], ["Giao lại"]],
  ["DELIVERED", [], []], ["COMPLETED", [], []], ["CANCELLED", [], []],
] as const)("renders permitted buttons for %s × COD/transfer", (status, cod, transfer) => {
  for (const [payment_method, labels] of [["COD", cod], ["BANK_TRANSFER", transfer]] as const) {
    const order: StaffOrder = { id: "o", status, payment_method, payment_status: undefined, total_vnd: 100, created_at: "2026-11-11" };
    const render = (can: (permission: string) => boolean, busy = false) => renderToStaticMarkup(<SalesOrderButtons order={order} can={can} busy={busy} act={vi.fn()} />);
    const html = render(() => true);
    for (const action of Object.values(orderActions)) expect(html.includes(`>${action.label}</button>`)).toBe(labels.some(label => label === action.label));
    expect(render(() => false)).not.toContain("<button");
    if (labels.length) expect(render(() => true, true).match(/disabled=""/g)).toHaveLength(labels.length);
  }
});
it("order menu belongs to Sales and requires order read; route uses employee session", () => {
  const route = "/sales/orders";
  const groups = consoleNavFor(new Set(["sales:order:read"]));
  expect(groups.find(group => group.title === "Bán hàng")?.items).toContainEqual(expect.objectContaining({ href: route, label: "Đơn hàng" }));
  expect(consoleRouteAllowed(route, new Set())).toBe(false);
  expect(consoleRouteAllowed(route, new Set(["sales:order:read"]))).toBe(true);
  expect(isEmployeeRoute(route)).toBe(true);
});
it("payment permission alone cannot expose COD confirmation or shipping", () => {
  const order: StaffOrder = { id: "o", status: "AWAITING_PAYMENT", payment_method: "BANK_TRANSFER", payment_status: undefined, total_vnd: 100, created_at: "2026-11-11" };
  const html = renderToStaticMarkup(<SalesOrderButtons order={order} can={permission => permission === "sales:payment:update"} busy={false} act={vi.fn()} />);
  expect(html).toContain("Xác nhận đã nhận tiền"); expect(html).not.toContain("Huỷ đơn");
});

it.each([undefined, null, "viewer", "other"])("delivery buttons follow assignment %s", assigned_driver_ref => {
  const order: StaffOrder = { id: "o", status: "DELIVERING", assigned_driver_ref, total_vnd: 100, created_at: "2026-11-11" };
  const html = renderToStaticMarkup(<SalesOrderButtons order={order} userId="viewer" can={() => true} busy={false} act={vi.fn()} />);
  expect(html.includes(">Đã giao</button>")).toBe(assigned_driver_ref !== "other");
  expect(html.includes(">Giao thất bại</button>")).toBe(assigned_driver_ref !== "other");
});
it("missing payment method hides both confirmations", () => {
  const html = renderToStaticMarkup(<SalesOrderButtons order={{ id: "o", status: "AWAITING_PAYMENT", total_vnd: 100, created_at: "2026-11-11" }} can={() => true} busy={false} act={vi.fn()} />);
  expect(html).not.toContain(">Xác nhận đơn</button>");
  expect(html).not.toContain(">Xác nhận đã nhận tiền</button>");
});
it.each([["PENDING", "Đang giữ hàng"], ["FAILED", "Không giữ được hàng"]])("đơn %s tắt nút Xác nhận kèm lý do", (reservation_state, label) => {
  const order: StaffOrder = { id: "o", status: "AWAITING_PAYMENT", payment_method: "COD", reservation_state, total_vnd: 100, created_at: "2026-11-11" };
  const html = renderToStaticMarkup(<SalesOrderButtons order={order} can={() => true} busy={false} act={vi.fn()} />);
  expect(html).toMatch(/<button[^>]*disabled=""[^>]*>Xác nhận đơn<\/button>/);
  expect(html).toContain("Chưa giữ được hàng");
  expect(html).toContain("Huỷ đơn");
  expect(reservationLabels[reservation_state]).toBe(label);
});
it("đơn đã giữ hàng vẫn xác nhận được", () => {
  const order: StaffOrder = { id: "o", status: "AWAITING_PAYMENT", payment_method: "COD", reservation_state: "HELD", total_vnd: 100, created_at: "2026-11-11" };
  const html = renderToStaticMarkup(<SalesOrderButtons order={order} can={() => true} busy={false} act={vi.fn()} />);
  expect(html).not.toMatch(/<button[^>]*disabled=""[^>]*>Xác nhận đơn<\/button>/);
  expect(html).not.toContain("Chưa giữ được hàng");
});
it("packed order shows cancel button to sales role only", () => {
  const order: StaffOrder = { id: "o", status: "PACKED", payment_method: "COD", total_vnd: 100, created_at: "2026-11-11" };
  const render = (roles: string[]) => renderToStaticMarkup(<SalesOrderButtons order={order} roles={roles} can={() => true} busy={false} act={vi.fn()} />);
  expect(render(["SALES"])).toContain(">Huỷ đơn</button>");
  expect(render(["CS_AGENT"])).not.toContain(">Huỷ đơn</button>");
});
