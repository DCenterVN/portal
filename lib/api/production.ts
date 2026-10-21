import { z } from "zod";
import { decodePlatform } from "@/lib/api/platform-contract";
import { apiFetch } from "@/lib/fetcher";

export interface ProductionTarget {
  id: string;
  target_code: string;
  branch_ref: string;
  period_start: string;
  period_end: string;
  title: string;
  status: "DRAFT" | "APPROVED" | "IN_PLANNING" | "HANDED_OFF" | "COMPLETED" | "REJECTED";
  lines: Array<{ product_ref: string; target_quantity: string | number; uom: string }>;
  created_by: string;
  approved_by?: string;
  approved_at?: string;
  created_at: string;
}

export interface FoodProductPlan {
  id: string;
  plan_code: string;
  target_ref: string;
  product_ref: string;
  variant_sku_code: string;
  planned_quantity: string | number;
  purpose?: "PREPARATION" | "PRODUCTION";
  revision?: number;
  servings_per_set?: number;
  uom: string;
  serving_size: string;
  components: Array<{ sku_ref: string; quantity: string | number; uom: string }>;
  status: "DRAFT" | "REVIEWED" | "PUBLISHING" | "WAITING_PRICE_APPROVAL" | "READY_FOR_HANDOFF" | "PUBLISHED" | "REJECTED";
  nutrition_snapshot: Record<string, unknown>;
  created_by: string;
  reviewed_by?: string;
  published_by?: string;
  created_at: string;
}

export interface ProductionOrder {
  id: string;
  order_code: string;
  source_plan_ref: string;
  target_ref: string;
  branch_ref: string;
  output_sku_ref: string;
  bom_ref: string;
  planned_quantity: number;
  actual_output_quantity: number;
  uom: string;
  status: "HANDED_OFF" | "ACCEPTED" | "ALLOCATED" | "IN_PROGRESS" | "COMPLETED" | "QC_PASSED" | "QC_FAILED" | "FAILED";
  reservation_ref?: string;
  finished_lot_ref?: string;
  finished_lot_expires_at?: string;
  failure_reason?: string;
  started_by?: string;
  started_at?: string;
  completed_by?: string;
  completed_at?: string;
  created_at: string;
}

export interface ShelfPlacement {
  id: string;
  finished_lot_ref: string;
  branch_ref: string;
  shelf_code: string;
  placed_quantity: number;
  available_quantity: number;
  uom: string;
  status: "PLACED" | "DEPLETED";
  trace_code: string;
  placed_at: string;
}

export interface PublicTraceability {
  trace_code: string;
  product_name: string;
  variant_name: string;
  produced_at: string;
  expires_at: string;
  qc_status: string;
  ingredients: Array<{ material_name: string; supplier_code: string }>;
  timeline: Array<{ stage: string; title: string; timestamp: string; passed: boolean }>;
}

export interface QCInspectionResult {
  production_order: ProductionOrder;
  inspection: {
    id: string;
    target_lot_ref: string;
    decision: "PASS" | "FAIL";
    sensory_result: Record<string, unknown>;
  };
}

async function errorMessage(res: Response, fallback: string) {
  const body = await res.json().catch(() => ({}));
  return body.message || body.error || fallback;
}

async function responseData<T>(res: Response): Promise<T> {
  const payload = await res.json();
  return (payload?.data ?? payload) as T;
}

function mutationHeaders() {
  return { "Content-Type": "application/json", "Idempotency-Key": crypto.randomUUID() };
}

// ---------------- Targets (VT-14 / VT-15) ----------------

export async function getTargets(): Promise<ProductionTarget[]> {
  const res = await apiFetch("/api/production/targets");
  if (!res.ok) throw new Error(await errorMessage(res, `Không tải được chỉ tiêu (${res.status})`));
  const payload = await responseData<{ items?: ProductionTarget[] }>(res);
  return payload.items || [];
}

export async function createTarget(input: { branch_ref: string; period_start: string; period_end: string; title: string; lines: Array<{ product_ref: string; target_quantity: string | number; uom: string }> }): Promise<ProductionTarget> {
  const res = await apiFetch("/api/production/targets", {
    method: "POST",
    headers: mutationHeaders(),
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error(await errorMessage(res, "Không thể tạo chỉ tiêu sản xuất"));
  return responseData<ProductionTarget>(res);
}

export async function approveTarget(targetId: string, decision: "APPROVE" | "REJECT"): Promise<ProductionTarget> {
  const res = await apiFetch(`/api/production/targets/${encodeURIComponent(targetId)}/approval`, {
    method: "POST",
    headers: mutationHeaders(),
    body: JSON.stringify({ decision }),
  });
  if (!res.ok) throw new Error(await errorMessage(res, "Không thể phê duyệt chỉ tiêu sản xuất"));
  return responseData<ProductionTarget>(res);
}

// ---------------- Food Product Plans (VT-21) ----------------

export async function createFoodPlan(targetId: string, input: PreparationPlanInput): Promise<FoodProductPlan> {
  const res = await apiFetch(`/api/production/targets/${encodeURIComponent(targetId)}/food-plans`, {
    method: "POST",
    headers: mutationHeaders(),
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error(await errorMessage(res, "Không thể tạo kế hoạch dinh dưỡng"));
  return responseData<FoodProductPlan>(res);
}

export async function getFoodPlans(targetId: string): Promise<FoodProductPlan[]> {
  const res = await apiFetch(`/api/production/targets/${encodeURIComponent(targetId)}/food-plans`);
  if (!res.ok) throw new Error(await errorMessage(res, `Không tải được kế hoạch (${res.status})`));
  const payload = await responseData<{ items?: FoodProductPlan[] }>(res);
  return payload.items ?? [];
}

export async function reviewFoodPlan(planId: string): Promise<FoodProductPlan> {
  const res = await apiFetch(`/api/production/food-plans/${encodeURIComponent(planId)}/review`, {
    method: "POST",
    headers: mutationHeaders(),
    body: "{}",
  });
  if (!res.ok) throw new Error(await errorMessage(res, "Không thể đánh giá kế hoạch dinh dưỡng"));
  return responseData<FoodProductPlan>(res);
}

export async function publishFoodPlan(planId: string): Promise<{ food_plan: FoodProductPlan; variant_sku_ref: string; bom_ref: string; cost_snapshot_ref: string; pricing_status: string }> {
  const res = await apiFetch(`/api/production/food-plans/${encodeURIComponent(planId)}/publish`, {
    method: "POST",
    headers: mutationHeaders(),
    body: "{}",
  });
  if (!res.ok) throw new Error(await errorMessage(res, "Không thể xuất bản kế hoạch dinh dưỡng"));
  return responseData<{ food_plan: FoodProductPlan; variant_sku_ref: string; bom_ref: string; cost_snapshot_ref: string; pricing_status: string }>(res);
}

export async function resumeFoodPlanHandoff(planId: string): Promise<{ food_plan: FoodProductPlan; production_order: ProductionOrder }> {
  const res = await apiFetch(`/api/production/food-plans/${encodeURIComponent(planId)}/resume-handoff`, {
    method: "POST",
    headers: mutationHeaders(),
		body: "{}",
  });
  if (!res.ok) throw new Error(await errorMessage(res, "Không thể kích hoạt chuyển giao sản xuất"));
  return responseData<{ food_plan: FoodProductPlan; production_order: ProductionOrder }>(res);
}

// ---------------- Production Orders (VT-09..VT-12) ----------------

export async function getOrders({ forPicker = false } = {}): Promise<ProductionOrder[]> {
  const res = await apiFetch(forPicker ? "/api/production/orders?status=QC_PASSED" : "/api/production/orders");
  if (!res.ok) {
    if (forPicker) throw new Error("Không thể tải danh sách lô thành phẩm. Thử lại sau.");
    return [];
  }
  const payload = await responseData<{ items?: ProductionOrder[] }>(res);
  return payload.items || [];
}

export async function acceptOrder(orderId: string): Promise<ProductionOrder> {
  const res = await apiFetch(`/api/production/orders/${encodeURIComponent(orderId)}/acceptance`, {
    method: "POST",
    headers: mutationHeaders(),
    body: "{}",
  });
  if (!res.ok) throw new Error(await errorMessage(res, "Không thể tiếp nhận lệnh sản xuất"));
  return responseData<ProductionOrder>(res);
}

export async function allocateOrderLots(orderId: string): Promise<ProductionOrder> {
  const res = await apiFetch(`/api/production/orders/${encodeURIComponent(orderId)}/lot-allocations`, {
    method: "POST",
    headers: mutationHeaders(),
    body: "{}",
  });
  if (!res.ok) throw new Error(await errorMessage(res, "Không thể phân bổ nguyên liệu FEFO"));
  return responseData<ProductionOrder>(res);
}

export async function startOrder(orderId: string, roleCode: string = "VT-10"): Promise<ProductionOrder> {
  const res = await apiFetch(`/api/production/orders/${encodeURIComponent(orderId)}/start`, {
    method: "POST",
    headers: mutationHeaders(),
    body: JSON.stringify({ role_code: roleCode }),
  });
  if (!res.ok) throw new Error(await errorMessage(res, "Không thể bắt đầu chế biến"));
  return responseData<ProductionOrder>(res);
}

export async function completeOrder(orderId: string, actualQuantity: number, inputLotRefs: string[] = [], roleCode: string = "VT-12"): Promise<ProductionOrder> {
  const res = await apiFetch(`/api/production/orders/${encodeURIComponent(orderId)}/completion`, {
    method: "POST",
    headers: mutationHeaders(),
    body: JSON.stringify({ actual_output_quantity: actualQuantity, input_lot_refs: inputLotRefs, role_code: roleCode }),
  });
  if (!res.ok) throw new Error(await errorMessage(res, "Không thể hoàn tất và đóng gói"));
  return responseData<ProductionOrder>(res);
}

// ---------------- QC Decision (VT-13) ----------------

export async function decideQC(orderId: string, input: { decision: "PASS" | "FAIL"; core_temperature_celsius?: number; package_check_passed: boolean; sensory_result: Record<string, string>; failure_reason?: string }): Promise<QCInspectionResult> {
  const res = await apiFetch(`/api/production/finished-goods-qc-inspections/${encodeURIComponent(orderId)}/complete`, {
    method: "POST",
    headers: mutationHeaders(),
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error(await errorMessage(res, "Lỗi kiểm định QC (SoD violation hoặc trạng thái không hợp lệ)"));
  return responseData<QCInspectionResult>(res);
}

// ---------------- Shelf Placement (VT-08 / VT-16) ----------------

export async function getShelfPlacements(): Promise<ShelfPlacement[]> {
  const res = await apiFetch("/api/inventory/shelf-placements");
  if (!res.ok) return [];
  const payload = await responseData<{ items?: ShelfPlacement[] }>(res);
  return payload.items || [];
}

export async function placeOnShelf(input: { finished_lot_ref: string; branch_ref: string; shelf_code: string; placed_quantity: number; uom?: string; trace_code?: string }): Promise<ShelfPlacement> {
  const res = await apiFetch("/api/inventory/shelf-placements", {
    method: "POST",
    headers: mutationHeaders(),
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error(await errorMessage(res, "Không thể đưa hàng lên kệ"));
  return responseData<ShelfPlacement>(res);
}

// ---------------- Public Traceability (VT-01) ----------------

export async function getPublicTraceability(traceCode: string): Promise<PublicTraceability> {
  const res = await apiFetch(`/api/public/traceability/${encodeURIComponent(traceCode)}`);
  if (!res.ok) throw new Error(await errorMessage(res, "Không tìm thấy xuất xứ sản phẩm"));
  return responseData<PublicTraceability>(res);
}

export interface PackPlanInput {
  schema_version: 1;
  set_ref: string;
  set_updated_at: string;
  slot_ratios: Array<{ slot: FoodSlot; options: Array<{ sku_ref: string | null; ratio: string }> }>;
}
export type PreparationPlanInput = {
  product_ref: string; variant_sku_code: string; planned_quantity: string;
  uom: string; serving_size: string; servings_per_set: number;
  nutrition_snapshot?: Record<string, unknown>;
} & (
  | { components: Array<{ sku_ref: string; quantity: string; uom: string }>; pack_plan?: never }
  | { pack_plan: PackPlanInput; components?: never }
);
export async function getFoodPlan(id: string): Promise<FoodProductPlan> {
  const res = await apiFetch(`/api/production/food-plans/${encodeURIComponent(id)}`);
  if (!res.ok) throw new Error(await errorMessage(res, `Không tải được set (${res.status})`));
  return responseData<FoodProductPlan>(res);
}
export async function updateFoodPlan(id: string, input: PreparationPlanInput & { expected_revision: number }): Promise<FoodProductPlan> {
  const res = await apiFetch(`/api/production/food-plans/${encodeURIComponent(id)}`, { method: "PUT", headers: mutationHeaders(), body: JSON.stringify(input) });
  if (!res.ok) throw new Error(await errorMessage(res, `Không lưu được set (${res.status})`));
  return responseData<FoodProductPlan>(res);
}
export interface MaterialRequirements {
  target_id: string; food_plan_id?: string; plan_revision?: number; plan_revisions: Record<string, number>;
  computed_at: string; lines: MaterialRequirement[]; all_lines: MaterialRequirement[];
  total: number; hidden_count: number; season_message: string;
}
export type MaterialRequirement = import("./sales").Material & { sku_ref: string; quantity: string; uom: string };
export async function getMaterialRequirements(scope: "targets" | "food-plans", id: string, query = ""): Promise<MaterialRequirements> {
  const res = await apiFetch(`/api/production/${scope}/${encodeURIComponent(id)}/material-requirements?${query}`);
  if (!res.ok) throw new Error(await errorMessage(res, `Không tải được nhu cầu (${res.status})`));
  return responseData<MaterialRequirements>(res);
}
export async function getProductionContext(): Promise<{ permissions?: string[]; active_context?: { branch_id?: string; branch_name?: string } }> {
  const res = await apiFetch("/api/auth/context");
  if (!res.ok) throw new Error("Không tải được quyền");
  return res.json();
}

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

const RecipeComponentResponseSchema = RecipeComponentSchema.extend({ name: z.string().nullable().optional() });

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
