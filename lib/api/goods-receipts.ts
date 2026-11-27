import { z } from "zod";
import { inventoryMutation, inventoryRequest } from "./suppliers";
import type { CreateGoodsReceiptRequest } from "./inventory/types";
import type { SupplierReceipt } from "./supplier-history";

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
export function createGoodsReceipt(input: ReceiptInput, key?: string) {
  const body = inputSchema.parse(input);
  return inventoryRequest("goods-receipts", receiptSchema, inventoryMutation("POST", body, key));
}

const qtyText = z.union([z.number(), z.string()]).transform(v => String(v));
const qtyNum = z.union([z.number(), z.string()]).transform(v => Number(v));

const rawReceiptLineSchema = z.object({
  id: z.string().uuid(),
  goods_receipt_id: z.string().uuid(),
  sku_ref: z.string().uuid(),
  expected_quantity: qtyText,
  actual_quantity: qtyText,
  uom: z.string(),
  unit_cost_vnd: z.number().int().nullable().optional().transform(v => v ?? null),
});

const rawReceiptItemSchema = z.object({
  id: z.string().uuid(),
  branch_ref: z.string().uuid(),
  supplier_ref: z.string().uuid(),
  supplier_name: z.string(),
  supplier_code: z.string(),
  expected_at: z.string(),
  notes: z.string().nullable().optional().transform(v => v ?? null),
  status: z.string(),
  expected_quantity: qtyText,
  actual_quantity: qtyText,
  total_amount_vnd: z.number().int(),
  created_by_ref: z.string().uuid(),
  created_at: z.string(),
  completed_at: z.string().nullable().optional().transform(v => v ?? null),
  lines: z.array(rawReceiptLineSchema).nullish().transform(items => items ?? []),
});

const receiptListPageSchema = z.object({
  items: z.array(rawReceiptItemSchema).nullish().transform(items => items ?? []),
  total: z.number().int().optional(),
  next_cursor: z.string().nullish().transform(value => value ?? ""),
});

const receiptDetailSchema = rawReceiptItemSchema.extend({
  lots: z.array(z.object({
    id: z.string().uuid(),
    sku_ref: z.string().uuid(),
    supplier_lot_code: z.string(),
    status: z.string(),
    initial_quantity: qtyNum,
    remaining_quantity: qtyNum,
    uom: z.string(),
  })).nullish().transform(items => items ?? []),
});

export type GoodsReceiptSummary = z.infer<typeof rawReceiptItemSchema>;
export type GoodsReceiptListPage = z.infer<typeof receiptListPageSchema>;
export type GoodsReceiptDetail = SupplierReceipt & {
  supplier_name: string;
  supplier_code: string;
  expected_quantity: string;
  actual_quantity: string;
  notes: string | null;
  lots: z.infer<typeof receiptDetailSchema>["lots"];
};

export type GoodsReceiptListQuery = {
  branchRef?: string;
  status?: string;
  supplierRef?: string;
  from?: string;
  to?: string;
  cursor?: string;
  limit?: number;
};

export function listGoodsReceipts(filters: GoodsReceiptListQuery = {}): Promise<GoodsReceiptListPage> {
  const query = new URLSearchParams({ limit: String(filters.limit ?? 20) });
  if (filters.branchRef) query.set("branch_ref", filters.branchRef);
  if (filters.status) query.set("status", filters.status);
  if (filters.supplierRef) query.set("supplier_ref", filters.supplierRef);
  if (filters.from) query.set("from", filters.from);
  if (filters.to) query.set("to", filters.to);
  if (filters.cursor) query.set("cursor", filters.cursor);
  return inventoryRequest(`goods-receipts?${query}`, receiptListPageSchema);
}

export async function getGoodsReceiptDetail(id: string): Promise<GoodsReceiptDetail> {
  const raw = await inventoryRequest(`goods-receipts/${encodeURIComponent(id)}`, receiptDetailSchema);
  return {
    id: raw.id,
    branch_ref: raw.branch_ref,
    supplier_ref: raw.supplier_ref,
    supplier_name: raw.supplier_name,
    supplier_code: raw.supplier_code,
    status: raw.status,
    created_at: raw.created_at,
    expected_at: raw.expected_at,
    completed_at: raw.completed_at,
    total_amount_vnd: raw.total_amount_vnd,
    expected_quantity: raw.expected_quantity,
    actual_quantity: raw.actual_quantity,
    notes: raw.notes,
    lots: raw.lots,
    lines: raw.lines.map(line => {
      const unitCost = line.unit_cost_vnd;
      const expectedQty = Number(line.expected_quantity);
      const actualQty = Number(line.actual_quantity);
      return {
        receipt_line_ref: line.id,
        sku_ref: line.sku_ref,
        uom: line.uom,
        expected_quantity: line.expected_quantity,
        actual_quantity: line.actual_quantity,
        unit_cost_vnd: unitCost,
        expected_amount_vnd: unitCost === null || !Number.isFinite(expectedQty) ? null : Math.round(expectedQty * unitCost),
        actual_amount_vnd: unitCost === null || !Number.isFinite(actualQty) ? null : Math.round(actualQty * unitCost),
      };
    }),
  };
}
