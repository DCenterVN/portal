import { z } from "zod";
import { decodePlatform } from "@/lib/api/platform-contract";
import { FetchError, apiFetch } from "@/lib/fetcher";

export const RawAllergensSchema = z.object({
  known: z.boolean(),
  contains: z.array(z.enum(["GLUTEN", "CRUSTACEANS", "EGGS", "FISH", "PEANUTS", "SOYBEANS", "MILK", "TREE_NUTS", "CELERY", "MUSTARD", "SESAME", "SULPHITES", "LUPIN", "MOLLUSCS"])).refine(items => new Set(items).size === items.length, "Duplicate values")
}).strict().refine(value => value.known || value.contains.length === 0, "Unknown allergens must have empty contains");

export const RawLabelsViewSchema = z.object({
  sku_ref: z.string().uuid(),
  allergen_summary: RawAllergensSchema,
  avoidance_flags: z.array(z.enum(["PORK", "BEEF", "ANIMAL", "ALCOHOL", "MSG", "SPICY", "NGU_VI_TAN"])).refine(items => new Set(items).size === items.length, "Duplicate values"),
  diet_flags: z.array(z.enum(["VEGETARIAN", "VEGAN"])).refine(items => new Set(items).size === items.length, "Duplicate values").nullable(),
  updated_at: z.string().datetime({ offset: true })
}).strict();

export type RawAllergens = z.infer<typeof RawAllergensSchema>;
export type RawLabelsView = z.infer<typeof RawLabelsViewSchema>;

async function responseData<T>(res: Response): Promise<T> {
  const payload = await res.json();
  return (payload?.data ?? payload) as T;
}
async function errorMessage(res: Response, fallback: string) {
  const body = await res.json().catch(() => ({}));
  return body.message || body.error || fallback;
}

export interface Material {
  id: string; sku_code: string; name: string; category_ref?: string;
  material_group_code?: string | null; uom_code: string; selectable: boolean; season_months: number[] | null;
  season_note: string | null; reference_price_vnd: number | null;
  reference_pack_quantity: string | null; reference_pack_uom: string | null;
  reference_observed_at: string | null; normalized_unit_price: string | null;
  price_source: string;
}
export interface MaterialPage {
  items: Material[]; categories: Array<{ id: string; slug: string; name: string; parent_ref: string }>;
  next_cursor: string; season_message: string;
}
export async function getMaterials(query = ""): Promise<MaterialPage> {
  const res = await apiFetch(`/api/sales/skus?kind=RAW_MATERIAL&limit=20&${query}`);
  if (!res.ok) throw new Error(await errorMessage(res, `Không tải được nguyên liệu (${res.status})`));
  return responseData<MaterialPage>(res);
}
export interface CreateMaterialInput {
  name: string; uom_code: "KG" | "L" | "EA"; material_group_code: string;
  allergens: RawAllergens["contains"] | null; avoidance_flags: RawLabelsView["avoidance_flags"];
  diet_flags: RawLabelsView["diet_flags"]; season_months: number[] | null;
}
export type ExistingMaterial = Pick<Material, "id" | "name"> & { code: string };
export async function createMaterial(input: CreateMaterialInput, idempotencyKey: string): Promise<Material> {
  const res = await apiFetch("/api/sales/skus", { method: "POST", headers: { "Content-Type": "application/json", "Idempotency-Key": idempotencyKey }, body: JSON.stringify(input) });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new FetchError(body.message || "Không tạo được nguyên liệu", res.status, body);
  }
  return responseData<Material>(res);
}

const UpdateRawLabelsRequestSchema = z.object({
  allergen_summary: RawAllergensSchema,
  avoidance_flags: z.array(z.enum(["PORK", "BEEF", "ANIMAL", "ALCOHOL", "MSG", "SPICY", "NGU_VI_TAN"])).refine(items => new Set(items).size === items.length, "Duplicate values"),
  diet_flags: z.array(z.enum(["VEGETARIAN", "VEGAN"])).refine(items => new Set(items).size === items.length, "Duplicate values").nullable(),
  expected_updated_at: z.string().datetime({ offset: true })
}).strict();

export type UpdateRawLabelsRequest = z.infer<typeof UpdateRawLabelsRequestSchema>;

async function rawLabelsRequest<T>(path: string, schema: z.ZodType<T>, method = "GET", input?: unknown): Promise<T> {
  const res = await apiFetch(`/api/food-packs/sales${path}`, {
    method, ...(input === undefined ? {} : { headers: { "Content-Type": "application/json", "Idempotency-Key": crypto.randomUUID() }, body: JSON.stringify(input) }),
  });
  if (!res.ok) throw new Error(await errorMessage(res, `Sales API trả về ${res.status}`));
  const envelope = z.object({ code: z.number().int(), status: z.string(), message: z.string(), data: z.unknown() }).strict().parse(await res.json());
  return decodePlatform(envelope, schema);
}
export function getRawLabels(id: string) { return rawLabelsRequest(`/skus/${encodeURIComponent(id)}/labels`, RawLabelsViewSchema); }
export function updateRawLabels(id: string, input: UpdateRawLabelsRequest) {
  return rawLabelsRequest(`/skus/${encodeURIComponent(id)}/labels`, RawLabelsViewSchema, "PATCH", UpdateRawLabelsRequestSchema.parse(input));
}
