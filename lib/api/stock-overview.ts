import { z } from "zod";
import { apiFetch, FetchError } from "@/lib/fetcher";
import { inventoryMutation, inventoryPages, inventoryRequest } from "./suppliers";

const uuid = z.string().uuid();

const stockLevelItemSchema = z.object({
  id: uuid,
  branch_ref: uuid,
  sku_ref: uuid,
  on_hand_quantity: z.number(),
  reserved_quantity: z.number(),
  available_quantity: z.number(),
  usable_quantity: z.number().optional(),
  shelf_pending_quantity: z.number().optional(),
  sellable_quantity: z.number().optional(),
  uom: z.string(),
  updated_at: z.string(),
});

const stockLevelPageSchema = z.object({
  items: z.array(stockLevelItemSchema).nullish().transform(items => items ?? []),
  next_cursor: z.string().nullish().transform(value => value ?? ""),
});

const inventoryLotItemSchema = z.object({
  id: uuid,
  sku_ref: uuid,
  branch_ref: uuid,
  supplier_lot_code: z.string(),
  storage_location_code: z.string().nullish().transform(value => value ?? ""),
  initial_quantity: z.number(),
  remaining_quantity: z.number(),
  uom: z.string(),
  received_temperature_celsius: z.number().nullish().transform(value => value ?? null),
  expires_at: z.string().nullish().transform(value => value ?? ""),
  status: z.string(),
  created_at: z.string().nullish().transform(value => value ?? ""),
});

const inventoryLotPageSchema = z.object({
  items: z.array(inventoryLotItemSchema).nullish().transform(items => items ?? []),
  next_cursor: z.string().nullish().transform(value => value ?? ""),
});

const skuMetaSchema = z.object({
  id: uuid,
  sku_code: z.string(),
  name: z.string(),
  uom_code: z.string().optional(),
  kind: z.string().optional(),
  status: z.string().optional(),
});

export type StockLevelItem = z.infer<typeof stockLevelItemSchema>;
export type InventoryLotItem = z.infer<typeof inventoryLotItemSchema>;
export type SkuMeta = z.infer<typeof skuMetaSchema>;

const pagedQuery = (branchRef: string, cursor: string) =>
  new URLSearchParams({ branch_ref: branchRef, page_size: "100", ...(cursor ? { cursor } : {}) });

export async function listBranchStockLevels(branchRef: string): Promise<StockLevelItem[]> {
  const items = await inventoryPages(cursor =>
    inventoryRequest(`stock-levels?${pagedQuery(branchRef, cursor)}`, stockLevelPageSchema),
  );
  return items.filter(item => item.branch_ref === branchRef);
}

export async function listBranchInventoryLots(branchRef: string): Promise<InventoryLotItem[]> {
  const items = await inventoryPages(cursor =>
    inventoryRequest(`inventory-lots?${pagedQuery(branchRef, cursor)}`, inventoryLotPageSchema),
  );
  return items.filter(item => item.branch_ref === branchRef);
}

const CHUNK_SIZE = 100;

async function fetchSkuNamesChunk(refs: string[]): Promise<SkuMeta[]> {
  const res = await apiFetch(`/api/sales/skus/names?${new URLSearchParams({ sku_refs: refs.join(",") })}`, { cache: "no-store" });
  const payload: unknown = await res.json().catch(() => null);
  if (!res.ok) throw new FetchError("Không tải được danh sách tên hàng", res.status, payload);
  const body = (payload && typeof payload === "object" && "data" in payload ? payload.data : payload) as { items?: unknown };
  return z.array(skuMetaSchema).parse(body?.items ?? []);
}

export async function getSkuMetadata(refs: string[]): Promise<Map<string, SkuMeta>> {
  const unique = [...new Set(refs.filter(Boolean))];
  if (!unique.length) return new Map();
  const chunks = Array.from({ length: Math.ceil(unique.length / CHUNK_SIZE) }, (_, i) =>
    unique.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE),
  );
  const pages = await Promise.all(chunks.map(fetchSkuNamesChunk));
  return new Map(pages.flat().map(item => [item.id, item] as const));
}

const stockMovementItemSchema = z.object({
  id: uuid,
  branch_ref: uuid,
  sku_ref: uuid,
  lot_ref: uuid,
  movement_type: z.string(),
  quantity: z.coerce.number(),
  uom: z.string(),
  reference_type: z.string(),
  reference_id: uuid,
  actor_ref: uuid,
  notes: z.string().nullish().transform(value => value ?? ""),
  created_at: z.string(),
  supplier_lot_code: z.string().nullish().transform(value => value ?? ""),
});

const stockMovementPageSchema = z.object({
  items: z.array(stockMovementItemSchema).nullish().transform(items => items ?? []),
  total: z.number().int().optional(),
  next_cursor: z.string().nullish().transform(value => value ?? ""),
});

export type StockMovementItem = z.infer<typeof stockMovementItemSchema>;
export type StockMovementPage = z.infer<typeof stockMovementPageSchema>;

export async function listStockMovements(options: {
  branchRef?: string;
  skuRef?: string;
  lotRef?: string;
  movementType?: string;
  cursor?: string;
  limit?: number;
} = {}): Promise<StockMovementPage> {
  const query = new URLSearchParams({ limit: String(options.limit ?? 50) });
  if (options.branchRef) query.set("branch_ref", options.branchRef);
  if (options.skuRef) query.set("sku_ref", options.skuRef);
  if (options.lotRef) query.set("lot_ref", options.lotRef);
  if (options.movementType) query.set("movement_type", options.movementType);
  if (options.cursor) query.set("cursor", options.cursor);
  return inventoryRequest(`stock-movements?${query}`, stockMovementPageSchema);
}

export function disposeInventoryLot(lotId: string, body: { reason: string; notes?: string }, key?: string) {
  return inventoryRequest(`inventory-lots/${encodeURIComponent(lotId)}/dispose`, inventoryLotItemSchema, inventoryMutation("POST", body, key));
}

export function quarantineInventoryLot(lotId: string, body: { reason: string }, key?: string) {
  return inventoryRequest(`inventory-lots/${encodeURIComponent(lotId)}/quarantine`, inventoryLotItemSchema, inventoryMutation("POST", body, key));
}

export function adjustInventoryLot(lotId: string, body: { actual_quantity: number; reason: string }, key?: string) {
  return inventoryRequest(`inventory-lots/${encodeURIComponent(lotId)}/adjustments`, inventoryLotItemSchema, inventoryMutation("POST", body, key));
}
