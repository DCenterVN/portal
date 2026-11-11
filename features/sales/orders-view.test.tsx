import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { expect, it, vi } from "vitest";
import { SalesOrderButtons } from "./orders-view";
import type { StaffOrder } from "@/lib/api/staff-orders";
import { orderActions } from "./order-actions";
import { consoleNavFor, consoleRouteAllowed } from "@/lib/navigation";
import { isEmployeeRoute } from "@/lib/fetcher";

it.each([
  ["AWAITING_PAYMENT", ["Xác nhận đơn", "Huỷ đơn"], ["Xác nhận đã nhận tiền", "Huỷ đơn"]],
  ["CONFIRMED", ["Đóng gói", "Huỷ đơn"], ["Đóng gói", "Huỷ đơn"]],
  ["PACKED", ["Giao đơn"], ["Giao đơn"]],
  ["DELIVERING", ["Đã giao", "Giao thất bại"], ["Đã giao", "Giao thất bại"]],
  ["DELIVERED", [], []], ["DELIVERY_FAILED", [], []], ["COMPLETED", [], []], ["CANCELLED", [], []],
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
