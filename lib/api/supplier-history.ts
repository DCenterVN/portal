import { z } from "zod";
import { inventoryRequest } from "./suppliers";

const amount = z.number().int().nonnegative().nullable();
const lineSchema = z.object({
  receipt_line_ref: z.string().uuid(), sku_ref: z.string().uuid(), uom: z.string(),
  expected_quantity: z.string(), actual_quantity: z.string(), unit_cost_vnd: amount,
  expected_amount_vnd: amount, actual_amount_vnd: amount,
});
const receiptSchema = z.object({
  id: z.string().uuid(), branch_ref: z.string().uuid(), supplier_ref: z.string().uuid(),
  status: z.string(), created_at: z.string(), expected_at: z.string(), completed_at: z.string().nullable(),
  total_amount_vnd: z.number().int(), lines: z.array(lineSchema),
});
const historySchema = z.object({ items: z.array(receiptSchema), total: z.number().int(), next_cursor: z.string() });
export type SupplierReceipt = z.infer<typeof receiptSchema>;
export type SupplierHistory = z.infer<typeof historySchema>;
export type SupplierHistoryQuery = { cursor?: string; from?: string; to?: string };
export function getSupplierHistory(supplierId: string, filters: SupplierHistoryQuery = {}): Promise<SupplierHistory> {
  const query = new URLSearchParams({ page_size: "20" });
  for (const key of ["cursor", "from", "to"] as const) if (filters[key]) query.set(key, filters[key]);
  return inventoryRequest(`suppliers/${encodeURIComponent(supplierId)}/goods-receipts?${query}`, historySchema);
}
