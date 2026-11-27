import { OPERATIONS } from "@/lib/contracts/operations.generated";
import type { StaffOrder } from "@/lib/api/staff-orders";
import { formatVND } from "@/lib/format";
import { FetchError } from "@/lib/fetcher";
import { requestErrorMessage } from "@/lib/error-message";
import { orderStatuses } from "@/lib/order-detail";

export { orderStatuses };
export const orderActions = {
  confirm: { label: "Xác nhận đơn", permission: OPERATIONS.confirmOrder.actionKey },
  "payments/confirm": { label: "Xác nhận đã nhận tiền", permission: OPERATIONS.confirmOrderPayment.actionKey },
  pack: { label: "Đóng gói", permission: OPERATIONS.packOrder.actionKey },
  ship: { label: "Giao đơn", permission: OPERATIONS.shipOrder.actionKey },
  deliver: { label: "Đã giao", permission: OPERATIONS.deliverOrder.actionKey },
  "delivery-failure": { label: "Giao thất bại", permission: OPERATIONS.reportDeliveryFailure.actionKey },
  cancel: { label: "Huỷ đơn", permission: OPERATIONS.cancelOrder.actionKey },
  redeliver: { label: "Giao lại", permission: OPERATIONS.shipOrder.actionKey },
  "reassign-driver": { label: "Đổi người giao", permission: OPERATIONS.shipOrder.actionKey },
};
export const paymentStatusLabels: Record<string, string> = {
  PENDING_COD: "Chờ thu tiền khi giao", INITIATED: "Chờ chuyển khoản", SUCCESS: "Đã thanh toán", FAILED: "Thanh toán lỗi", REFUND_PENDING: "Cần hoàn tiền",
};
export const reservationLabels: Record<string, string> = {
  PENDING: "Đang giữ hàng", HELD: "Đã giữ hàng", FAILED: "Không giữ được hàng", RELEASED: "Đã trả hàng về kho", CONSUMED: "Đã xuất kho",
};
export const holdBlockedReason = "Chưa giữ được hàng cho đơn này, chưa thể xác nhận. Chờ hệ thống giữ hàng hoặc huỷ đơn.";
export const confirmBlocked = (order: Pick<StaffOrder, "reservation_state">) => !!order.reservation_state && order.reservation_state !== "HELD";
export type OrderAction = keyof typeof orderActions;
export const choosesDriver = (action?: OrderAction) => action === "ship" || action === "reassign-driver";
export function availableActions(order: Pick<StaffOrder, "status" | "payment_method"> & Partial<Pick<StaffOrder, "payment_status" | "channel" | "assigned_driver_ref">>, can: (action: string) => boolean, userId?: string, roles: readonly string[] = []) {
  const actions: OrderAction[] = [];
  if (order.status === "AWAITING_PAYMENT") {
    if (order.payment_method === "COD" && order.channel !== "IN_STORE") actions.push("confirm");
    if (order.payment_method === "BANK_TRANSFER") actions.push("payments/confirm");
  }
  if (order.status === "CONFIRMED" && order.channel !== "IN_STORE") actions.push("pack");
  if (order.status === "PACKED") actions.push("ship");
  if (order.status === "DELIVERING" && (order.assigned_driver_ref == null || order.assigned_driver_ref === userId)) actions.push("deliver", "delivery-failure");
  if (order.status === "DELIVERING") actions.push("reassign-driver");
  if (order.status === "DELIVERY_FAILED") actions.push("redeliver");
  if (["AWAITING_PAYMENT", "CONFIRMED"].includes(order.status) || order.status === "PACKED" && roles.includes("SALES")) actions.push("cancel");
  return actions.filter(path => can(orderActions[path].permission)).map(path => ({ path, ...orderActions[path] }));
}
export const cancelNeedsReason = (status: string) => status === "CONFIRMED" || status === "PACKED";
const paidOrder = "Đơn đã thu tiền";
export const refundNotice = (order: Pick<StaffOrder, "status" | "payment_status" | "total_vnd">) =>
  order.status === "CANCELLED" && order.payment_status === "REFUND_PENDING" ? `${paidOrder}, khoản ${formatVND(order.total_vnd)} đang chờ hoàn cho khách.` : "";
export const paidCancelNotice = (order: Pick<StaffOrder, "payment_status">, action: OrderAction) =>
  action === "cancel" && order.payment_status === "SUCCESS" ? `${paidOrder}, huỷ xong đơn sẽ chờ hoàn tiền.` : "";
const warehouseNotReturned = "Kho chưa nhận lại hàng đã đóng gói nên chưa huỷ được đơn. Đơn vẫn ở trạng thái Đã đóng gói, thử lại sau ít phút.";
export function orderErrorMessage(error: unknown, action: OrderAction, before: string, after?: string): string {
  if (!(error instanceof FetchError) || error.status !== 409) return requestErrorMessage(error);
  if (after === undefined) return "Đơn vừa thay đổi nên chưa xử lý được, và chưa tải lại được đơn. Mở lại đơn rồi thử lại.";
  if (after !== before) return `Đơn vừa đổi trạng thái sang ${orderStatuses[after] ?? "trạng thái khác"}. Màn hình đã hiện trạng thái mới.`;
  return action === "cancel" && before === "PACKED" ? warehouseNotReturned : "Đơn đang được xử lý ở bước khác, thử lại sau ít phút.";
}
