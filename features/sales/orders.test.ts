import { afterEach, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { availableActions, cancelNeedsReason, orderErrorMessage, paidCancelNotice, refundNotice } from "./order-actions";
import { FetchError } from "@/lib/fetcher";
import { getStaffOrdersPage, getStaffOrder, mutateStaffOrder } from "@/lib/api/staff-orders";

afterEach(() => vi.unstubAllGlobals());
it.each(["confirm", "pack", "ship", "deliver", "delivery-failure", "payments/confirm", "redeliver", "reassign-driver"])("BFF forwards %s including body and stable key", async action => {
  const fetch = vi.fn().mockResolvedValue(Response.json({ data: {} }));
  vi.stubGlobal("fetch", fetch);
  const routes = {
    confirm: () => import("../../app/api/sales/orders/[id]/confirm/route"),
    pack: () => import("../../app/api/sales/orders/[id]/pack/route"),
    ship: () => import("../../app/api/sales/orders/[id]/ship/route"),
    deliver: () => import("../../app/api/sales/orders/[id]/deliver/route"),
    "delivery-failure": () => import("../../app/api/sales/orders/[id]/delivery-failure/route"),
    "payments/confirm": () => import("../../app/api/sales/orders/[id]/payments/confirm/route"),
    redeliver: () => import("../../app/api/sales/orders/[id]/redeliver/route"),
    "reassign-driver": () => import("../../app/api/sales/orders/[id]/reassign-driver/route"),
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
  ["CONFIRMED", "BANK_TRANSFER", ["pack", "cancel"]],
  ["PACKED", "COD", ["ship"]],
  ["DELIVERING", "COD", ["deliver", "delivery-failure", "reassign-driver"]],
  ["DELIVERY_FAILED", "COD", ["redeliver"]],
  ["DELIVERED", "COD", []], ["COMPLETED", "COD", []], ["CANCELLED", "COD", []],
] as const)("actions %s × %s", (status, payment_method, expected) => {
  expect(availableActions({ status, payment_method, payment_status: payment_method === "BANK_TRANSFER" && status === "CONFIRMED" ? "SUCCESS" : undefined }, () => true).map(a => a.path)).toEqual(expected);
  expect(availableActions({ status, payment_method }, () => false)).toEqual([]);
});
it("staff list, detail and cancel never send branch_id; ship sends selected driver", async () => {
  const order = { id: "o", status: "PACKED", total_vnd: 100, created_at: "2026-11-11" };
  const fetch = vi.fn().mockResolvedValueOnce(Response.json({ code: 200, status: "success", message: "OK", data: { items: [order] } })).mockImplementation(async () => Response.json({ code: 200, status: "success", message: "OK", data: order }));
  vi.stubGlobal("fetch", fetch);
  await getStaffOrdersPage(); await getStaffOrder("o"); await mutateStaffOrder("o", "cancel", { reason: "Đổi ý" }, "cancel-key");
  await mutateStaffOrder("o", "ship", { driver_ref: "selected-driver" }, "ship-key");
  for (const [url] of fetch.mock.calls) expect(String(url)).not.toContain("branch_id");
  expect(JSON.parse(String(fetch.mock.calls[3][1]?.body))).toEqual({ driver_ref: "selected-driver" });
});
it.each([
  [["SALES"], true], [["CS_AGENT"], false], [["BRANCH_MANAGER"], false], [[], false],
] as const)("cancel packed order with roles %j is %s", (roles, shown) => {
  const paths = availableActions({ status: "PACKED", payment_method: "COD" }, () => true, undefined, roles).map(a => a.path);
  expect(paths.includes("cancel")).toBe(shown);
  expect(paths).toContain("ship");
});
it("cancel packed order still needs the cancellation permission", () => {
  const paths = availableActions({ status: "PACKED", payment_method: "COD" }, key => key !== "sales:order_cancellation:create", undefined, ["SALES"]).map(a => a.path);
  expect(paths).not.toContain("cancel");
});
it.each([["AWAITING_PAYMENT", false], ["CONFIRMED", true], ["PACKED", true]])("cancel reason required for %s is %s", (status, required) => {
  expect(cancelNeedsReason(status)).toBe(required);
});
it("refund notice only for cancelled order with refund pending", () => {
  expect(refundNotice({ status: "CANCELLED", payment_status: "REFUND_PENDING", total_vnd: 250000 })).toContain("250.000");
  expect(refundNotice({ status: "CANCELLED", payment_status: "FAILED", total_vnd: 250000 })).toBe("");
  expect(refundNotice({ status: "PACKED", payment_status: "SUCCESS", total_vnd: 250000 })).toBe("");
});
it("lớp gọi API chỉ trả mã trạng thái và mã lỗi, không gán nghĩa nghiệp vụ cho 409", async () => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json({ code: 409, status: "error", message: "state_conflict raw", errors: { error_code: "state_conflict" } }, { status: 409 })));
  const error = await mutateStaffOrder("o", "cancel", { reason: "Khách không nhận" }, "k").catch(cause => cause);
  expect(error).toBeInstanceOf(FetchError);
  expect([error.status, error.code]).toEqual([409, "state_conflict"]);
  expect(error.message).not.toContain("Kho chưa nhận lại hàng");
});
const conflict = new FetchError("state_conflict raw", 409, {}, null);
conflict.code = "state_conflict";
it("huỷ bị 409, tải lại thấy đơn vẫn Đã đóng gói: báo kho chưa nhận lại hàng", () => {
  expect(orderErrorMessage(conflict, "cancel", "PACKED", "PACKED")).toBe("Kho chưa nhận lại hàng đã đóng gói nên chưa huỷ được đơn. Đơn vẫn ở trạng thái Đã đóng gói, thử lại sau ít phút.");
});
it("huỷ bị 409, tải lại thấy đơn đã sang Đang giao: báo vừa đổi trạng thái, không nói đơn vẫn đã đóng gói", () => {
  const message = orderErrorMessage(conflict, "cancel", "PACKED", "DELIVERING");
  expect(message).toContain("Đơn vừa đổi trạng thái");
  expect(message).toContain("Đang giao");
  expect(message).not.toContain("Kho chưa nhận lại hàng");
  expect(message).not.toContain("Đã đóng gói");
});
it("huỷ đơn Đã xác nhận bị 409 mà đơn không đổi: không nhắc kho nhận lại hàng đã đóng gói", () => {
  expect(orderErrorMessage(conflict, "cancel", "CONFIRMED", "CONFIRMED")).not.toContain("đóng gói");
});
it("409 mà chưa tải lại được đơn: báo đơn vừa thay đổi, không khẳng định trạng thái", () => {
  const message = orderErrorMessage(conflict, "cancel", "PACKED", undefined);
  expect(message).toContain("vừa thay đổi");
  expect(message).not.toContain("Kho chưa nhận lại hàng");
});
it.each([[403, "quyền"], [404, "Không tìm thấy"], [422, "chưa hợp lệ"], [503, "thử lại"]])("lỗi %s của đơn hàng hiện câu tiếng Việt, không lộ câu thô của backend", (status, part) => {
  const message = orderErrorMessage(new FetchError("missing permission sales:order:update", status), "pack", "CONFIRMED");
  expect(message).toContain(part);
  expect(message).not.toContain("missing permission");
});
it("luật đơn đã thu tiền: chỉ khi huỷ đơn đã thanh toán thành công", () => {
  expect(paidCancelNotice({ payment_status: "SUCCESS" }, "cancel")).toContain("chờ hoàn tiền");
  expect(paidCancelNotice({ payment_status: "PENDING_COD" }, "cancel")).toBe("");
  expect(paidCancelNotice({ payment_status: "REFUND_PENDING" }, "cancel")).toBe("");
  expect(paidCancelNotice({ payment_status: "SUCCESS" }, "pack")).toBe("");
  expect(paidCancelNotice({}, "cancel")).toBe("");
});
