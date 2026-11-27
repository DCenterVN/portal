import { z } from "zod";
import { inventoryRequest } from "./suppliers";

const PAGE_SIZE = 20;
const lotSchema = z.object({
  lot_id: z.string(), sku_ref: z.string(), supplier_lot_code: z.string(), uom: z.string(),
  remaining_quantity: z.number(), pending_quantity: z.number(),
  inspection_quantity: z.number().nullish().transform(value => value ?? 0),
  expires_at: z.string().nullish().transform(value => value ?? ""),
  origin: z.string(), source_code: z.string().nullish().transform(value => value ?? ""),
});
const pageSchema = z.object({
  items: z.array(lotSchema).nullish().transform(items => items ?? []),
  total: z.number(), page: z.number(), limit: z.number(),
});
export type ShelfPendingLot = z.infer<typeof lotSchema>;

export async function getShelfPendingPage(branch: string, cursor: string): Promise<{ items: ShelfPendingLot[]; next_cursor: string }> {
  const page = Number(cursor) || 1;
  const query = new URLSearchParams({ branch_ref: branch, page: String(page), limit: String(PAGE_SIZE) });
  const result = await inventoryRequest(`shelf-pending-lots?${query}`, pageSchema);
  return { items: result.items, next_cursor: result.page * result.limit < result.total ? String(result.page + 1) : "" };
}
