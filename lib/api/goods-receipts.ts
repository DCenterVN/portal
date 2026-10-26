import { z } from "zod";
import { inventoryMutation, inventoryRequest } from "./suppliers";
import { apiFetch } from "@/lib/fetcher";

export type ReceiptInput = { branch_ref: string; supplier_ref: string; expected_at: string; notes?: string; expected_lines: { sku_ref: string; uom: string; expected_quantity: number; agreement_version_ref: string; price_line_ref: string }[] };
const receiptSchema = z.object({ id: z.string().uuid(), status: z.string(), total_amount_vnd: z.number().optional() });
export const receiptDraftSchema = z.object({ supplier: z.union([z.string().uuid(), z.literal("")]), date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), lines: z.array(z.object({ sku: z.union([z.string().uuid(), z.literal("")]), quantity: z.number().finite().nonnegative() })).min(1).max(100) });
export async function getReceiptBranch(): Promise<string> {
  const response = await apiFetch("/api/auth/context", { cache: "no-store" });
  if (!response.ok) throw new Error("Không tải được chi nhánh đang làm việc");
  const context = z.object({ active_context: z.object({ branch_id: z.string().uuid() }) }).parse(await response.json());
  return context.active_context.branch_id;
}
export function createGoodsReceipt(input: ReceiptInput, key?: string) {
  const body = { branch_ref: input.branch_ref, supplier_ref: input.supplier_ref, expected_at: input.expected_at, notes: input.notes,
    expected_lines: input.expected_lines.map(line => ({ sku_ref: line.sku_ref, uom: line.uom, expected_quantity: line.expected_quantity, agreement_version_ref: line.agreement_version_ref, price_line_ref: line.price_line_ref })) };
  return inventoryRequest("goods-receipts", receiptSchema, inventoryMutation("POST", body, key));
}
