import { afterEach, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { availableActions } from "./order-actions";
import { getStaffOrders, getStaffOrder, mutateStaffOrder } from "@/lib/api/staff-orders";

afterEach(() => vi.unstubAllGlobals());
it.each(["confirm", "pack", "ship", "deliver", "delivery-failure", "payments/confirm"])("BFF forwards %s including body and stable key", async action => {
  const fetch = vi.fn().mockResolvedValue(Response.json({ data: {} }));
  vi.stubGlobal("fetch", fetch);
  const routes = {
    confirm: () => import("../../app/api/sales/orders/[id]/confirm/route"),
    pack: () => import("../../app/api/sales/orders/[id]/pack/route"),
    ship: () => import("../../app/api/sales/orders/[id]/ship/route"),
    deliver: () => import("../../app/api/sales/orders/[id]/deliver/route"),
    "delivery-failure": () => import("../../app/api/sales/orders/[id]/delivery-failure/route"),
    "payments/confirm": () => import("../../app/api/sales/orders/[id]/payments/confirm/route"),
  };
  const { POST } = await routes[action as keyof typeof routes]();
  const body = JSON.stringify({ driver_ref: "driver", reason: "Không liên hệ được", bank_transaction_ref: "BANK-1" });
  const response = await POST(new NextRequest(`http://portal.test/api/sales/orders/order/${action}`, { method: "POST", headers: { cookie: "access_token=jwt", "Idempotency-Key": "stable", "Content-Type": "application/json" }, body }), { params: Promise.resolve({ id: "order" }) });
  expect(response.status).toBe(200);
  expect(fetch).toHaveBeenCalledWith(expect.stringContaining(`/sales/orders/order/${action}`), expect.objectContaining({ method: "POST", body, headers: expect.objectContaining({ "Idempotency-Key": "stable" }) }));
});
it.each([
  ["AWAITING_PAYMENT", "COD", ["confirm", "cancel"]],
  ["AWAITING_PAYMENT", "BANK_TRANSFER", ["payments/confirm", "cancel"]],
  ["AWAITING_PAYMENT", undefined, ["cancel"]],
  ["CONFIRMED", "COD", ["pack", "cancel"]],
  ["CONFIRMED", "BANK_TRANSFER", ["pack"]],
  ["PACKED", "COD", ["ship"]],
  ["DELIVERING", "COD", ["deliver", "delivery-failure"]],
  ["DELIVERED", "COD", []], ["DELIVERY_FAILED", "COD", []], ["COMPLETED", "COD", []], ["CANCELLED", "COD", []],
] as const)("actions %s × %s", (status, payment_method, expected) => {
  expect(availableActions({ status, payment_method, payment_status: payment_method === "BANK_TRANSFER" && status === "CONFIRMED" ? "SUCCESS" : undefined }, () => true).map(a => a.path)).toEqual(expected);
  expect(availableActions({ status, payment_method }, () => false)).toEqual([]);
});
it("staff list, detail and cancel never send branch_id; ship sends selected driver", async () => {
  const order = { id: "o", status: "PACKED", total_vnd: 100, created_at: "2026-11-11" };
  const fetch = vi.fn().mockResolvedValueOnce(Response.json({ code: 200, status: "success", message: "OK", data: { items: [order] } })).mockImplementation(async () => Response.json({ code: 200, status: "success", message: "OK", data: order }));
  vi.stubGlobal("fetch", fetch);
  await getStaffOrders(); await getStaffOrder("o"); await mutateStaffOrder("o", "cancel", { reason: "Đổi ý" }, "cancel-key");
  await mutateStaffOrder("o", "ship", { driver_ref: "selected-driver" }, "ship-key");
  for (const [url] of fetch.mock.calls) expect(String(url)).not.toContain("branch_id");
  expect(JSON.parse(String(fetch.mock.calls[3][1]?.body))).toEqual({ driver_ref: "selected-driver" });
});
