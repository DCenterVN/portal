import { z } from "zod";
import { inventoryMutation, inventoryRequest } from "./suppliers";
import { apiFetch } from "@/lib/fetcher";
import type { CreateGoodsReceiptRequest } from "./inventory/types";

export type ReceiptInput = CreateGoodsReceiptRequest;
const lineSchema = z.object({
  sku_ref: z.string().uuid(), uom: z.string().min(1), expected_quantity: z.number().finite().positive(),
  unit_cost_vnd: z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER).optional(),
  agreement_version_ref: z.string().uuid().optional(), price_line_ref: z.string().uuid().optional(),
}).refine(line => Boolean(line.agreement_version_ref) === Boolean(line.price_line_ref), "Cần gửi đủ cặp tham chiếu bảng giá");
const inputSchema: z.ZodType<CreateGoodsReceiptRequest> = z.object({
  branch_ref: z.string().uuid(), supplier_ref: z.string().uuid(), expected_at: z.string().datetime({ offset: true }), notes: z.string().optional(),
  expected_lines: z.array(lineSchema).min(1).max(100),
});
const receiptSchema = z.object({ id: z.string().uuid(), status: z.string(), total_amount_vnd: z.number().optional() });
export const receiptDraftSchema = z.object({ supplier: z.union([z.string().uuid(), z.literal("")]), date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), lines: z.array(z.object({ sku: z.union([z.string().uuid(), z.literal("")]), quantity: z.number().finite().nonnegative() })).min(1).max(100) });
export async function getReceiptBranch(): Promise<string> {
  const response = await apiFetch("/api/auth/context", { cache: "no-store" });
  if (!response.ok) throw new Error("Không tải được chi nhánh đang làm việc");
  const context = z.object({ active_context: z.object({ branch_id: z.string().uuid() }) }).parse(await response.json());
  return context.active_context.branch_id;
}
export function createGoodsReceipt(input: ReceiptInput, key?: string) {
  const body = inputSchema.parse(input);
  return inventoryRequest("goods-receipts", receiptSchema, inventoryMutation("POST", body, key));
}
