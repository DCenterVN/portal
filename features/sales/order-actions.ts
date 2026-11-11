import { OPERATIONS } from "@/lib/contracts/operations.generated";
import type { StaffOrder } from "@/lib/api/staff-orders";

export { orderStatuses } from "@/lib/order-detail";
export const orderActions = {
  confirm: { label: "Xác nhận đơn", permission: OPERATIONS.confirmOrder.actionKey },
  "payments/confirm": { label: "Xác nhận đã nhận tiền", permission: OPERATIONS.confirmOrderPayment.actionKey },
  pack: { label: "Đóng gói", permission: OPERATIONS.packOrder.actionKey },
  ship: { label: "Giao đơn", permission: OPERATIONS.shipOrder.actionKey },
  deliver: { label: "Đã giao", permission: OPERATIONS.deliverOrder.actionKey },
  "delivery-failure": { label: "Giao thất bại", permission: OPERATIONS.reportDeliveryFailure.actionKey },
  cancel: { label: "Huỷ đơn", permission: OPERATIONS.cancelOrder.actionKey },
};
export type OrderAction = keyof typeof orderActions;
export function availableActions(order: Pick<StaffOrder, "status" | "payment_method"> & Partial<Pick<StaffOrder, "payment_status" | "channel" | "assigned_driver_ref">>, can: (action: string) => boolean, userId?: string) {
  const actions: OrderAction[] = [];
  if (order.status === "AWAITING_PAYMENT") {
    if (order.payment_method === "COD" && order.channel !== "IN_STORE") actions.push("confirm");
    if (order.payment_method === "BANK_TRANSFER") actions.push("payments/confirm");
  }
  if (order.status === "CONFIRMED" && order.channel !== "IN_STORE") actions.push("pack");
  if (order.status === "PACKED") actions.push("ship");
  if (order.status === "DELIVERING" && (order.assigned_driver_ref == null || order.assigned_driver_ref === userId)) actions.push("deliver", "delivery-failure");
  if (["AWAITING_PAYMENT", "CONFIRMED"].includes(order.status) && order.payment_status !== "SUCCESS") actions.push("cancel");
  return actions.filter(path => can(orderActions[path].permission)).map(path => ({ path, ...orderActions[path] }));
}
