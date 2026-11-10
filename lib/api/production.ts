import { z } from "zod";
import { apiFetch } from "@/lib/fetcher";
import { errorMessage, mutationHeaders, responseData } from "@/lib/api/production-http";
import type { FoodSlot } from "@/lib/api/production-pack";

export * from "@/lib/api/production-pack";

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

const publicTraceabilitySchema = z.object({
  trace_code: z.string(),
  product_name: z.string(),
  variant_name: z.string(),
  produced_at: z.string(),
  expires_at: z.string(),
  qc_status: z.string(),
  production_branch_name: z.string().nullish(),
  ingredients: z.array(z.object({
    material_name: z.string().nullish(),
    supplier_name: z.string().nullish(),
    received_at: z.string().nullish(),
    expires_at: z.string().nullish(),
    inbound_qc: z.object({ decision: z.enum(["PASS", "FAIL"]).nullish(), inspected_at: z.string().nullish() }).nullish(),
  })),
  timeline: z.array(z.object({ stage: z.string(), title: z.string(), timestamp: z.string(), passed: z.boolean() })),
});

export interface PublicTraceability extends z.infer<typeof publicTraceabilitySchema> {
  ingredients: Array<z.infer<typeof publicTraceabilitySchema>["ingredients"][number] & { supplier_code?: string }>;
}

export function parsePublicTraceability(payload: unknown): PublicTraceability {
  return publicTraceabilitySchema.parse(payload);
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
  if (!res.ok) throw new Error(forPicker ? "Không thể tải danh sách lô thành phẩm. Thử lại sau." : await errorMessage(res, `Không tải được lệnh sản xuất (${res.status})`));
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
  if (!res.ok) throw new Error(await errorMessage(res, `Không tải được kệ hàng (${res.status})`));
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
  return parsePublicTraceability(await responseData<unknown>(res));
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
