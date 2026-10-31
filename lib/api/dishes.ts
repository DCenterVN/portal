import { z } from "zod";
import { apiFetch, FetchError } from "@/lib/fetcher";
import type { DishContent, DishDraft, DraftKind, DraftRow } from "@/lib/dishes/types";
import type { DishDetail } from "@/lib/dishes/dish-detail";
import type { CompleteResult } from "@/lib/dishes/complete-dish";

const line = z.object({ sku_ref: z.string().nullable().default(null), quantity: z.string().nullish().transform(value => value ?? ""), uom: z.string().nullish().transform(value => value ?? "G"), yield_pct: z.string().nullish().transform(value => value ?? "100") });
const baseLine = line.extend({ sku_ref: z.string() });
export const contentSchema = z.object({
  schema_version: z.literal(1), name: z.string().nullable().default(null), category_ref: z.string().nullable().default(null),
  tags: z.array(z.string()).nullish().transform(value => value ?? []), servings: z.number().nullable().default(null),
  ingredients: z.array(line.extend({ row: z.string() })).nullish().transform(value => value ?? []),
  seasonings: z.array(z.object({ row: z.string(), slot: z.enum(["COT", "NUOC_CHAM", "GIA_VI_THEM"]), package_ref: z.string().nullable().default(null), removable: z.boolean().default(false) })).nullish().transform(value => value ?? []),
  reason: z.string().nullable().default(null), base: z.object({ product_ref: z.string(), set_ref: z.string(), set_updated_at: z.string(), slots: z.object({ DAM: z.object({ package_ref: z.string(), lines: z.array(baseLine) }).optional(), RAU: z.object({ package_ref: z.string(), lines: z.array(baseLine) }).optional(), TINH_BOT: z.object({ package_ref: z.string(), lines: z.array(baseLine) }).optional() }) }).nullable().default(null),
});
export const draftSchema = z.object({ id: z.string(), kind: z.enum(["CREATE", "COPY", "VARIANT", "REVISION"]), revision: z.number(), status: z.string(), source_product_ref: z.string().nullable().default(null), source_set_ref: z.string().nullable().default(null), source_set_updated_at: z.string().nullable().default(null), content: contentSchema, progress: z.record(z.string()).default({}) });
export type { DishListRow, PackOption, CostPreview } from "@/lib/dishes/types";
import type { DishListRow, PackOption, CostPreview } from "@/lib/dishes/types";
export type Page<T> = { items: T[]; next_cursor: string | null };
export const safeMessage = (value: string) => value.replace(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, "mục đã chọn");
export async function dishRequest<T>(path: string, method = "GET", input?: unknown, key?: string): Promise<T> {
  const res = await apiFetch(path, { method, headers: { "Content-Type": "application/json", ...(key ? { "Idempotency-Key": key } : {}) }, ...(input === undefined ? {} : { body: JSON.stringify(input) }) });
  if (res.status === 204) return undefined as T;
  const body = await res.json();
  if (!res.ok) throw new FetchError(safeMessage(typeof body.message === "string" ? body.message : "Không xử lý được món. Thử lại."), res.status, body);
  return (body.data ?? body) as T;
}
export function draftAttempt() {
  let previous: { payload: string; key: string } | null = null;
  const attempt = (input: unknown) => {
    const payload = JSON.stringify(input);
    if (previous?.payload !== payload) previous = { payload, key: crypto.randomUUID() };
    return previous.key;
  };
  attempt.done = () => { previous = null; };
  return attempt;
}
export type CreateDraft = { kind: DraftKind; content: DishContent; source_product_ref?: string; source_set_ref?: string };
const sales = "/api/food-packs/sales";
export async function createDishDraft(input: CreateDraft, key: string): Promise<DishDraft> {
  const result = await dishRequest<{ draft: unknown }>(`${sales}/dish-drafts`, "POST", input, key);
  return draftSchema.parse(result.draft);
}
export async function getDishDraft(id: string): Promise<DishDraft> {
  const result = await dishRequest<{ draft: unknown }>(`${sales}/dish-drafts/${id}`);
  return draftSchema.parse(result.draft);
}
export async function saveDishDraft(id: string, content: DishContent, expected_revision: number): Promise<DishDraft> {
  const result = await dishRequest<{ draft: unknown }>(`${sales}/dish-drafts/${id}`, "PUT", { content, expected_revision });
  return draftSchema.parse(result.draft);
}
export const discardDishDraft = (id: string) => dishRequest<void>(`${sales}/dish-drafts/${id}`, "DELETE");
export const listDishDrafts = (query = "status=OPEN") => dishRequest<Page<DraftRow>>(`${sales}/dish-drafts?${query}`);
export const listDishes = (query: string) => dishRequest<Page<DishListRow>>(`${sales}/dishes?${query}`);
export const getDishDetail = (id: string) => dishRequest<DishDetail>(`/api/dishes/${id}`);
export async function finishDish(id: string) {
  const res = await apiFetch(`/api/dishes/drafts/${id}/complete`, { method: "POST" });
  const result = await res.json();
  if (!res.ok && !result.failed_step) throw new FetchError(safeMessage(result.message ?? "Chưa hoàn tất được món"), res.status, result);
  return result as CompleteResult;
}
export const previewCost = (content: DishContent) => dishRequest<CostPreview>("/api/food-packs/production/recipes/cost-preview", "POST", { servings: content.servings, lines: content.ingredients.filter(line => line.sku_ref).map(({ sku_ref, quantity, uom, yield_pct }) => ({ sku_ref, quantity, uom, yield_pct })), packages: content.seasonings.filter(line => line.package_ref).map(line => ({ sku_ref: line.package_ref, quantity: 1 })) });
export const searchPacks = (q: string, cursor = "") => dishRequest<Page<PackOption>>(`${sales}/packages?${new URLSearchParams({ q, cursor, limit: "50" })}`);
export const getDishPack = (id: string) => dishRequest<PackOption>(`${sales}/packages/${id}`);
export const getPackRecipe = (id: string) => dishRequest<{ current: { components: z.infer<typeof baseLine>[] } | null }>(`/api/food-packs/production/packages/${id}/recipes`);
export const getSaleCategories = () => dishRequest<{ categories: { id: string; name: string }[] }>("/api/sales/skus?kind=RAW_MATERIAL&limit=1");
