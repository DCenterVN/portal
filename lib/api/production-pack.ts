import { z } from "zod";
import { decodePlatform } from "@/lib/api/platform-contract";
import { apiFetch } from "@/lib/fetcher";
import { errorMessage } from "@/lib/api/production-http";

// PACK schemas follow production/api/openapi.public.yaml.
const RecipeComponentSchema = z.object({
  sku_ref: z.string().uuid(),
  quantity: z.string().regex(new RegExp("^(?!0(?:\\.0{1,3})?$)(0|[1-9][0-9]*)(\\.[0-9]{1,3})?$")),
  uom: z.enum(["KG", "L", "EA", "G", "ML"]),
  yield_pct: z.string().regex(new RegExp("^(100(\\.0{1,3})?|[1-9][0-9]?(\\.[0-9]{1,3})?|0\\.(?!0{1,3}$)[0-9]{1,3})$"))
}).strict();

const PrepStepSchema = z.object({
  instruction: z.string().min(1),
  duration_seconds: z.number().int().min(0)
}).strict();

const RecipeComponentResponseSchema = RecipeComponentSchema.extend({ name: z.string().nullable().optional(), inactive: z.boolean().optional() });

const PackageRecipeSchema = z.object({
  id: z.string().uuid(),
  output_sku_ref: z.string().uuid(),
  output_quantity: z.literal(1),
  uom: z.enum(["EA"]),
  version: z.number().int().min(1),
  status: z.enum(["BOM_ACTIVE", "BOM_RETIRED"]),
  bom_code: z.string().min(1),
  components: z.array(RecipeComponentResponseSchema).min(1).max(100),
  prep_steps: z.array(PrepStepSchema)
}).strict();

const RecipeHistorySchema = z.object({
  current: z.union([PackageRecipeSchema, z.null()]),
  history: z.array(PackageRecipeSchema)
}).strict();

const FoodSlotSchema = z.enum(["TINH_BOT", "DAM", "RAU", "COT", "NUOC_CHAM", "GIA_VI_THEM"]);

const SlotSelectionSchema = z.object({
  slot: FoodSlotSchema,
  sku_ref: z.string().uuid().nullable()
}).strict();

const EvaluatedAllergensSchema = z.object({
  known: z.boolean(),
  contains: z.array(z.enum(["GLUTEN", "CRUSTACEANS", "EGGS", "FISH", "PEANUTS", "SOYBEANS", "MILK", "TREE_NUTS", "CELERY", "MUSTARD", "SESAME", "SULPHITES", "LUPIN", "MOLLUSCS"])).refine(items => new Set(items).size === items.length, "Duplicate values")
}).strict();

const UnknownLabelSourceSchema = z.object({
  sku_ref: z.string().uuid(),
  fields: z.array(z.enum(["allergen_summary", "diet_flags"])).min(1)
}).strict();

const RecipeVersionPinSchema = z.object({
  sku_ref: z.string().uuid(),
  bom_ref: z.string().uuid(),
  version: z.number().int().min(1)
}).strict();

const EvaluatedFoodSetSchema = z.object({
  set_ref: z.string().uuid(),
  selections: z.array(SlotSelectionSchema),
  allergen_summary: EvaluatedAllergensSchema,
  avoidance_flags: z.array(z.enum(["PORK", "BEEF", "ANIMAL", "ALCOHOL", "MSG", "SPICY", "NGU_VI_TAN"])).refine(items => new Set(items).size === items.length, "Duplicate values"),
  diet_flags: z.array(z.enum(["VEGETARIAN", "VEGAN"])).refine(items => new Set(items).size === items.length, "Duplicate values"),
  unknown: z.array(UnknownLabelSourceSchema),
  manual_hashtags: z.array(z.string()),
  system_hashtags: z.array(z.string()),
  derived_hashtags: z.array(z.string()),
  set_updated_at: z.string().datetime({ offset: true }),
  recipe_versions: z.array(RecipeVersionPinSchema),
  computed_at: z.string().datetime({ offset: true })
}).strict();

const CreatePackageRecipeRequestSchema = z.object({
  components: z.array(RecipeComponentSchema).min(1).max(100),
  prep_steps: z.array(PrepStepSchema)
}).strict();

const UpdatePackageRecipeRequestSchema = z.object({
  components: z.array(RecipeComponentSchema).min(1).max(100),
  prep_steps: z.array(PrepStepSchema),
  expected_version: z.number().int().min(1)
}).strict();

const RetirePackageRecipeRequestSchema = z.object({
  expected_version: z.number().int().min(1)
}).strict();

const EvaluateFoodSetRequestSchema = z.object({
  expected_updated_at: z.string().datetime({ offset: true }),
  selections: z.array(SlotSelectionSchema).max(6)
}).strict();

export type RecipeComponent = z.infer<typeof RecipeComponentSchema>;
export type PrepStep = z.infer<typeof PrepStepSchema>;
export type PackageRecipe = z.infer<typeof PackageRecipeSchema>;
export type RecipeHistory = z.infer<typeof RecipeHistorySchema>;
export type FoodSlot = z.infer<typeof FoodSlotSchema>;
export type SlotSelection = z.infer<typeof SlotSelectionSchema>;
export type EvaluatedAllergens = z.infer<typeof EvaluatedAllergensSchema>;
export type UnknownLabelSource = z.infer<typeof UnknownLabelSourceSchema>;
export type RecipeVersionPin = z.infer<typeof RecipeVersionPinSchema>;
export type EvaluatedFoodSet = z.infer<typeof EvaluatedFoodSetSchema>;
export type CreatePackageRecipeRequest = z.infer<typeof CreatePackageRecipeRequestSchema>;
export type UpdatePackageRecipeRequest = z.infer<typeof UpdatePackageRecipeRequestSchema>;
export type RetirePackageRecipeRequest = z.infer<typeof RetirePackageRecipeRequestSchema>;
export type EvaluateFoodSetRequest = z.infer<typeof EvaluateFoodSetRequestSchema>;

async function productionPackRequest<T>(path: string, schema: z.ZodType<T>, method = "GET", input?: unknown): Promise<T> {
  const res = await apiFetch(`/api/food-packs/production${path}`, {
    method, ...(input === undefined ? {} : { headers: { "Content-Type": "application/json" }, body: JSON.stringify(input) }),
  });
  if (!res.ok) throw new Error(await errorMessage(res, `Production API trả về ${res.status}`));
  const envelope = z.object({ code: z.number().int(), status: z.string(), message: z.string(), data: z.unknown() }).strict().parse(await res.json());
  return decodePlatform(envelope, schema);
}
export function createPackageRecipe(skuId: string, input: CreatePackageRecipeRequest) {
  return productionPackRequest(`/packages/${encodeURIComponent(skuId)}/recipes`, PackageRecipeSchema, "POST", CreatePackageRecipeRequestSchema.parse(input));
}
export function listPackageRecipes(skuId: string) {
  return productionPackRequest(`/packages/${encodeURIComponent(skuId)}/recipes`, RecipeHistorySchema);
}
export function getPackageRecipe(skuId: string, version: number) {
  return productionPackRequest(`/packages/${encodeURIComponent(skuId)}/recipes/${version}`, PackageRecipeSchema);
}
export function updatePackageRecipe(skuId: string, version: number, input: UpdatePackageRecipeRequest) {
  return productionPackRequest(`/packages/${encodeURIComponent(skuId)}/recipes/${version}`, PackageRecipeSchema, "PUT", UpdatePackageRecipeRequestSchema.parse(input));
}
export async function retirePackageRecipe(skuId: string, version: number, input: RetirePackageRecipeRequest): Promise<void> {
  const res = await apiFetch(`/api/food-packs/production/packages/${encodeURIComponent(skuId)}/recipes/${version}`, {
    method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify(RetirePackageRecipeRequestSchema.parse(input)),
  });
  if (!res.ok) throw new Error(await errorMessage(res, `Production API trả về ${res.status}`));
}
export function evaluateFoodSet(id: string, input: EvaluateFoodSetRequest) {
  return productionPackRequest(`/sets/${encodeURIComponent(id)}/evaluate`, EvaluatedFoodSetSchema, "POST", EvaluateFoodSetRequestSchema.parse(input));
}
