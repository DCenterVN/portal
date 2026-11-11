import { z } from "zod";

export const orderStatuses: Record<string, string> = {
  AWAITING_PAYMENT: "Chờ thanh toán", CONFIRMED: "Đã xác nhận", PACKED: "Đã đóng gói", DELIVERING: "Đang giao",
  DELIVERED: "Đã giao", DELIVERY_FAILED: "Giao thất bại", COMPLETED: "Hoàn tất", CANCELLED: "Đã huỷ",
};
export const orderDetailFields = {
  payment_method: z.enum(["COD", "BANK_TRANSFER", "CASH"]).nullish(),
  payment_status: z.enum(["PENDING_COD", "INITIATED", "SUCCESS", "FAILED"]).nullish(),
  items: z.array(z.object({
    sku_code: z.string().optional(), sku_name: z.string(), variant_label: z.string().nullish(),
    quantity: z.number(), unit_price_vnd: z.number(), line_total_vnd: z.number(),
  })).nullish(),
  state_history: z.array(z.object({ from_state: z.string().nullish(), to_state: z.string(), created_at: z.string() })).nullish(),
};
export type OrderDetails = z.infer<z.ZodObject<typeof orderDetailFields>>;
