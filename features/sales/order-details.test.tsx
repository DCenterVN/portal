import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, expect, it, vi } from "vitest";
import { getStaffOrder, getStaffOrders, mutateStaffOrder } from "@/lib/api/staff-orders";
import { getOrderDisplay } from "@/lib/api/sales";
import { formatVND } from "@/lib/format";
import { SalesOrdersView } from "./orders-view";
import { OrderDetailView } from "@/features/products/order-detail-view";

const fixture = vi.hoisted(() => ({ order: {
  id: "order", cart_ref: "cart", order_code: "DH-123", status: "DELIVERING", created_at: "2026-11-11T01:00:00Z",
  subtotal_vnd: 90000, total_vnd: 90000, payment_method: "COD", payment_status: "PENDING_COD", assigned_driver_ref: "viewer",
  items: [{ sku_code: "CA-1", sku_name: "Cá hồi", variant_label: "Phần lớn", quantity: 2, unit_price_vnd: 45000, line_total_vnd: 90000 }],
  state_history: [{ from_state: "PACKED", to_state: "DELIVERING", created_at: "2026-11-11T02:05:00Z" }],
} }));
vi.mock("./use-sales-orders", () => ({ useSalesOrders: () => ({
  list: { loading: false }, orders: [fixture.order], filter: "ALL", setFilter: vi.fn(), order: fixture.order,
  setSelected: vi.fn(), detail: {}, provinces: {}, communes: {}, pending: null, busy: false,
  can: () => true, userId: "viewer", act: vi.fn(), form: { register: vi.fn(() => ({})), formState: { errors: {} } },
}) }));
vi.mock("@/features/products/use-order-detail", () => ({ useOrderDetail: () => ({ order: fixture.order, loading: false, error: "", reason: "" }) }));
vi.mock("@/lib/access-boundary", () => ({ useAccess: () => ({ can: () => true }) }));
vi.mock("@/components/ui/sheet", () => ({
  Sheet: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SheetContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SheetHeader: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SheetTitle: ({ children }: { children: React.ReactNode }) => <h2>{children}</h2>,
  SheetDescription: ({ children }: { children: React.ReactNode }) => <p>{children}</p>,
}));
afterEach(() => vi.unstubAllGlobals());
const envelope = (data: unknown) => Response.json({ code: 200, status: "success", message: "OK", data });
it.each(["staff", "customer"])("%s detail renders item table and Vietnamese state history", screen => {
  const html = renderToStaticMarkup(screen === "staff" ? <SalesOrdersView /> : <OrderDetailView id="order" />);
  for (const label of ["Tên món", "Phần", "SL", "Đơn giá", "Thành tiền", "Cá hồi", "Phần lớn", formatVND(45000), formatVND(90000), "Lịch sử trạng thái", "11/11/2026 09:05", "Đã đóng gói → Đang giao"]) expect(html).toContain(label);
  expect(html).toContain(">2</td>");
  expect(html).not.toContain("CA-1");
});
it.each(["COD", "BANK_TRANSFER", "CASH"])("both clients retain %s payment, lines and state_history and accept old responses", async payment_method => {
  vi.stubGlobal("window", { localStorage: { getItem: () => "branch" } });
  const { cart_ref, subtotal_vnd, ...staffFields } = fixture.order;
  const order = { ...staffFields, cart_ref, subtotal_vnd, payment_method };
  const staffOrder = { ...staffFields, payment_method };
  const fetch = vi.fn().mockImplementation(async (url: string) => envelope(String(url).includes("page_size") ? { items: [order] } : order));
  vi.stubGlobal("fetch", fetch);
  expect(await getStaffOrder("order")).toEqual(staffOrder);
  expect(await getOrderDisplay("order")).toEqual(expect.objectContaining({ payment_method, payment_status: "PENDING_COD", items: order.items, state_history: order.state_history }));
  expect((await getStaffOrders())[0]).toEqual(staffOrder);
  expect((await getOrderDisplay())[0]).toEqual(expect.objectContaining({ payment_method, payment_status: "PENDING_COD" }));
  expect(await mutateStaffOrder("order", "ship", { driver_ref: "viewer" }, "key")).toEqual(staffOrder);
  const legacy = { id: "old", cart_ref: "cart", status: "AWAITING_PAYMENT", subtotal_vnd: 100, total_vnd: 100, created_at: "2026-11-11" };
  fetch.mockImplementation(async () => envelope(legacy));
  expect(await getStaffOrder("old")).toEqual(expect.objectContaining({ id: "old", status: "AWAITING_PAYMENT" }));
  expect(await getOrderDisplay("old")).toEqual(legacy);
});
