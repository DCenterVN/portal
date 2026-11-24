import { z } from "zod";
import { inventoryMutation, inventoryRequest } from "./suppliers";

export const ZONES = ["COLD", "CHILL", "DRY"] as const;
export type Zone = (typeof ZONES)[number];
export const zoneLabel: Record<string, string> = { COLD: "Lạnh", CHILL: "Mát", DRY: "Khô" };

const locationSchema = z.object({ id: z.string().uuid(), code: z.string(), name: z.string(), zone: z.string(), active: z.boolean() });
export const locationPageSchema = z.object({
  total: z.number().int().min(0).optional(),
  items: z.array(locationSchema).nullish().transform(items => items ?? []),
  pagination: z.object({ total_items: z.number().int().min(0), total_pages: z.number().int().min(0), current_page: z.number().int().min(1), limit: z.number().int().min(1) }).optional(),
});
export type StorageLocation = z.infer<typeof locationSchema>;
export type StorageLocationPage = z.infer<typeof locationPageSchema>;
export type StorageLocationQuery = { q?: string; zone?: string; active?: boolean; page?: number; limit?: number };

export const normalizeLocationCode = (text: string) => text.toUpperCase().replace(/[^A-Z0-9-]/g, "").slice(0, 32);

export function locationParams({ q = "", zone = "", active, page = 1, limit = 20 }: StorageLocationQuery = {}) {
  const query = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (q) query.set("q", q);
  if (zone) query.set("zone", zone);
  if (active !== undefined) query.set("active", String(active));
  return query;
}

const path = (id: string) => `storage-locations/${encodeURIComponent(id)}`;
export const getStorageLocations = (options: StorageLocationQuery = {}): Promise<StorageLocationPage> => inventoryRequest(`storage-locations?${locationParams(options)}`, locationPageSchema);
export const createStorageLocation = (input: { code: string; name: string; zone: string }, key?: string) => inventoryRequest("storage-locations", locationSchema, inventoryMutation("POST", input, key));
export const updateStorageLocation = (id: string, input: { name?: string; zone?: string; active?: boolean }, key?: string) => inventoryRequest(path(id), locationSchema, inventoryMutation("PATCH", input, key));
