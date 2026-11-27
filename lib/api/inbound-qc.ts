import { z } from "zod";
import { inventoryMutation, inventoryRequest } from "./suppliers";

const uuid = z.string().uuid();
const decodeAllergens = (value: string | string[] | null) => {
  if (Array.isArray(value)) return value;
  try { const parsed: unknown = JSON.parse(atob(value ?? "")); return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string") : []; } catch { return []; }
};
const lotSchema = z.object({
  id: uuid, goods_receipt_ref: uuid, goods_receipt_line_id: uuid.nullish().transform(value => value ?? ""), sku_ref: uuid,
  supplier_lot_code: z.string(), storage_location_code: z.string(), allergen_snapshot: z.union([z.string(), z.array(z.string()), z.null()]).transform(decodeAllergens),
  initial_quantity: z.number(), uom: z.string(), expires_at: z.string(), status: z.string(),
  inbound_qc_inspection_id: uuid.nullish().transform(value => value ?? null),
});
export const lotPageSchema = z.object({
  total: z.number().int().min(0).optional(),
  items: z.array(lotSchema).nullish().transform(items => items ?? []),
  pagination: z.object({ total_items: z.number().int().min(0), total_pages: z.number().int().min(0), current_page: z.number().int().min(1), limit: z.number().int().min(1) }).optional(),
});
export type InboundLotPage = z.infer<typeof lotPageSchema>;
export type InboundLotQuery = { status?: string; q?: string; page?: number; limit?: number };
const progressSchema = z.object({
  status: z.string(), decision: z.string().nullish().transform(value => value ?? null),
  sample_taken: z.boolean(), sensory_checked: z.boolean(), temperature_checked: z.boolean(), shelf_life_checked: z.boolean(),
});
export type InspectionProgress = z.infer<typeof progressSchema>;
const ackSchema = z.object({}).passthrough();

export type InboundLot = z.infer<typeof lotSchema>;
export type CriterionResult = { result: "PASS" | "FAIL"; failure_reason?: string; evidence_refs: string[] };
export type LotDecision = { decision: "APPROVE" | "REJECT"; reason: string; evidence_refs: string[] };

const lot = (id: string) => `inventory-lots/${encodeURIComponent(id)}`;
const inspection = (id: string) => `inbound-qc-inspections/${encodeURIComponent(id)}`;
const send = (path: string, method: "POST" | "PUT", body: unknown, key?: string) => inventoryRequest(path, ackSchema, inventoryMutation(method, body, key));
const metrics = (name: string, value: CriterionResult) => ({ qc_metrics: { [name]: value.result, ...(value.failure_reason ? { failure_reason: value.failure_reason } : {}) }, evidence_refs: value.evidence_refs });

export function inboundLotParams({ status = "", q = "", page = 1, limit = 10 }: InboundLotQuery = {}) {
  const query = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (status) query.set("status", status);
  if (q) query.set("q", q);
  return query;
}
export const getInboundLots = (options: InboundLotQuery = {}): Promise<InboundLotPage> => inventoryRequest(`inventory-lots?${inboundLotParams(options)}`, lotPageSchema);
export const getInboundLot = (id: string) => inventoryRequest(lot(id), lotSchema);
export const getInspectionProgress = (id: string) => inventoryRequest(inspection(id), progressSchema);

export const declareAllergens = (id: string, allergens: string[], key?: string) => send(`${lot(id)}/allergens`, "PUT", { allergen_snapshot: allergens }, key);
export const assignStorageLocation = (id: string, code: string, key?: string) => send(`${lot(id)}/storage-location`, "PUT", { storage_location_code: code }, key);
export const takeSamples = (inspectionID: string, lotID: string, note: string, key?: string) => send(`${inspection(inspectionID)}/samples`, "POST", { target_lot_ref: lotID, sample_plan: { note } }, key);
export const saveSensory = (id: string, value: CriterionResult, key?: string) => send(`${inspection(id)}/sensory-result`, "PUT", metrics("sensory_result", value), key);
export const saveTemperature = (id: string, celsius: number, value: CriterionResult, key?: string) => send(`${inspection(id)}/temperature-result`, "PUT", { core_temperature_celsius: celsius, ...metrics("temperature_result", value) }, key);
export const saveShelfLife = (id: string, expiry: string, value: CriterionResult, key?: string) => send(`${inspection(id)}/shelf-life-result`, "PUT", { expiry_date: expiry, ...metrics("shelf_life_result", value) }, key);
export const completeInspection = (id: string, value: CriterionResult, key?: string) =>
  send(`${inspection(id)}/complete`, "POST", { decision: value.result, failure_reason: value.failure_reason ?? null, evidence_refs: value.evidence_refs }, key);
export const decideLot = (id: string, value: LotDecision, key?: string) => send(`${lot(id)}/qc-decisions`, "POST", value, key);
