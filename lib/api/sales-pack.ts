import { z } from "zod";
import { apiFetch } from "@/lib/fetcher";
import { decodePlatform } from "@/lib/api/platform-contract";
import { errorMessage, mutationHeaders } from "./sales";
const FoodPackageSchema = z.object({
  id: z.string().uuid(), org_ref: z.string().uuid(), branch_ref: z.string().uuid(), product_ref: z.string().uuid(), code: z.string().min(1),
  name: z.string().min(1), variant_label: z.string().min(1), net_weight_g: z.number().int().min(1).max(2147483647),
  uom_code: z.enum(["EA"]), temperature_regime: z.string().min(1), kind: z.enum(["PRODUCED_VARIANT"]), sellable: z.boolean(),
  status: z.string(), updated_at: z.string().datetime({ offset: true })
}).strict();

const ManualHashtagsSchema = z.array(z.string().regex(new RegExp("^[a-z0-9]+(-[a-z0-9]+)*$"))).min(3).max(8).refine(items => new Set(items).size === items.length, "Duplicate values");

const FoodSlotSchema = z.enum(["TINH_BOT", "DAM", "RAU", "COT", "NUOC_CHAM", "GIA_VI_THEM"]);

const SetOptionSchema = z.object({
  sku_ref: z.string().uuid(), quantity: z.number().int().min(1), is_default: z.boolean()
}).strict();

const SetSlotSchema = z.object({
  slot: FoodSlotSchema, swappable: z.boolean(), removable: z.boolean(), options: z.array(SetOptionSchema).min(1)
}).strict();

const FoodSetSchema = z.object({
  id: z.string().uuid(), org_ref: z.string().uuid(), branch_ref: z.string().uuid(), product_ref: z.string().uuid(), code: z.string().min(1),
  name: z.string().min(1), variant_label: z.string().min(1), net_weight_g: z.number().int().min(1).max(2147483647),
  uom_code: z.enum(["EA"]), temperature_regime: z.string().min(1), kind: z.enum(["COMMERCIAL_SET"]), sku_type: z.enum(["SET"]),
  sellable: z.boolean(), status: z.string(), tags: ManualHashtagsSchema, system_hashtags: z.array(z.string()),
  slots: z.array(SetSlotSchema).max(6), updated_at: z.string().datetime({ offset: true })
}).strict();

const CreatePackageRequestSchema = z.object({
  product_ref: z.string().uuid(), code: z.string().min(1).max(56, "Mã gói tối đa 56 ký tự"), name: z.string().min(1),
  variant_label: z.string().min(1), net_weight_g: z.number().int().min(1).max(2147483647), uom_code: z.enum(["EA"]),
  temperature_regime: z.string().min(1)
}).strict();

const UpdatePackageRequestSchema = z.object({
  product_ref: z.string().uuid(), code: z.string().min(1).max(56, "Mã gói tối đa 56 ký tự"), name: z.string().min(1),
  variant_label: z.string().min(1), net_weight_g: z.number().int().min(1).max(2147483647), uom_code: z.enum(["EA"]),
  temperature_regime: z.string().min(1), expected_updated_at: z.string().datetime({ offset: true })
}).strict();
const CreateFoodSetRequestSchema = z.object({
  product_ref: z.string().uuid(), code: z.string().min(1), name: z.string().min(1), variant_label: z.string().min(1),
  net_weight_g: z.number().int().min(1).max(2147483647), uom_code: z.enum(["EA"]), temperature_regime: z.string().min(1),
  tags: ManualHashtagsSchema
}).strict();
const ReplaceFoodSetRequestSchema = z.object({
  tags: ManualHashtagsSchema, slots: z.array(SetSlotSchema).min(2).max(6), expected_updated_at: z.string().datetime({ offset: true })
}).strict();
const FoodPackagePageEnvelopeSchema = z.object({
  code: z.number().int(), status: z.string(), message: z.string(), data: z.object({
  items: z.array(FoodPackageSchema), next_cursor: z.string().nullable()
}).strict()
}).strict();
const FoodSetPageEnvelopeSchema = z.object({
  code: z.number().int(), status: z.string(), message: z.string(), data: z.object({
  items: z.array(FoodSetSchema), next_cursor: z.string().nullable()
}).strict()
}).strict();
export type FoodPackage = z.infer<typeof FoodPackageSchema>;
export type ManualHashtags = z.infer<typeof ManualHashtagsSchema>;
export type FoodSlot = z.infer<typeof FoodSlotSchema>;
export type SetOption = z.infer<typeof SetOptionSchema>;
export type SetSlot = z.infer<typeof SetSlotSchema>;
export type FoodSet = z.infer<typeof FoodSetSchema>;
export type CreatePackageRequest = z.infer<typeof CreatePackageRequestSchema>;
export type UpdatePackageRequest = z.infer<typeof UpdatePackageRequestSchema>;
export type CreateFoodSetRequest = z.infer<typeof CreateFoodSetRequestSchema>;
export type ReplaceFoodSetRequest = z.infer<typeof ReplaceFoodSetRequestSchema>;
async function salesPackRequest<T>(path: string, schema: z.ZodType<T>, method = "GET", input?: unknown): Promise<T> {
  const res = await apiFetch(`/api/food-packs/sales${path}`, {
    method, ...(input === undefined ? {} : { headers: mutationHeaders(), body: JSON.stringify(input) }),
  });
  if (!res.ok) throw new Error(await errorMessage(res, `Sales API trả về ${res.status}`));
  const envelope = z.object({ code: z.number().int(), status: z.string(), message: z.string(), data: z.unknown() }).strict().parse(await res.json());
  return decodePlatform(envelope, schema);
}
async function retireSalesPack(path: string): Promise<void> {
  const res = await apiFetch(`/api/food-packs/sales${path}`, { method: "DELETE" });
  if (!res.ok) throw new Error(await errorMessage(res, `Sales API trả về ${res.status}`));
}
export function createPackage(input: CreatePackageRequest) {
  return salesPackRequest("/packages", FoodPackageSchema, "POST", CreatePackageRequestSchema.parse(input));
}
export function listPackages(filters: { product_ref?: string; cursor?: string; limit?: number } = {}) {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) if (value !== undefined) query.set(key, String(value));
  return salesPackRequest(`/packages?${query}`, FoodPackagePageEnvelopeSchema.shape.data);
}
export function getPackage(id: string) {
  return salesPackRequest(`/packages/${encodeURIComponent(id)}`, FoodPackageSchema);
}
export function updatePackage(id: string, input: UpdatePackageRequest) {
  return salesPackRequest(`/packages/${encodeURIComponent(id)}`, FoodPackageSchema, "PUT", UpdatePackageRequestSchema.parse(input));
}
export function retirePackage(id: string) { return retireSalesPack(`/packages/${encodeURIComponent(id)}`); }
export function createFoodSet(input: CreateFoodSetRequest) {
  return salesPackRequest("/sets", FoodSetSchema, "POST", CreateFoodSetRequestSchema.parse(input));
}
export function listFoodSets(filters: { q?: string; tags?: string[]; category_slug?: string; month?: number; product_ref?: string; cursor?: string; limit?: number } = {}) {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (Array.isArray(value)) value.forEach(tag => query.append(key, tag));
    else if (value !== undefined) query.set(key, String(value));
  }
  return salesPackRequest(`/sets?${query}`, FoodSetPageEnvelopeSchema.shape.data);
}
export function getFoodSet(id: string) { return salesPackRequest(`/sets/${encodeURIComponent(id)}`, FoodSetSchema); }
export function updateFoodSet(id: string, input: ReplaceFoodSetRequest) {
  return salesPackRequest(`/sets/${encodeURIComponent(id)}`, FoodSetSchema, "PUT", ReplaceFoodSetRequestSchema.parse(input));
}
export function retireFoodSet(id: string) { return retireSalesPack(`/sets/${encodeURIComponent(id)}`); }
