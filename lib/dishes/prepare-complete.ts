import type { DishDraft as CompletingDraft } from "./complete-dish";
import { toBase, type DishDetail } from "./dish-detail";
import type { DishDraft, Journey } from "./types";

export type ServerDraft = CompletingDraft & { source_product_ref: string | null; source_set_ref: string | null; source_set_updated_at?: string | null };
export type PrepareDeps = { loadDetail(productRef: string): Promise<DishDetail> };
export type Prepared =
  | { ok: true; draft: DishDraft; sourceJourney?: Journey; existingVariants: { servings: number; set_ref: string; variant_label: string }[] }
  | { ok: false; status: 409; message: string };

export async function prepareComplete(draft: ServerDraft, deps: PrepareDeps): Promise<Prepared> {
  if (draft.kind === "CREATE") return { ok: true, draft: { ...draft, content: { ...draft.content, base: null } }, existingVariants: [] };
  const { source_product_ref, source_set_ref, source_set_updated_at } = draft;
  if (!source_product_ref || !source_set_ref || !source_set_updated_at) return { ok: false, status: 409, message: "Nháp thiếu nguồn, mở lại món để tạo nháp mới" };
  const detail = await deps.loadDetail(source_product_ref);
  const variant = detail.variants.find(item => item.set_ref === source_set_ref);
  if (!variant) return { ok: false, status: 409, message: "Không tìm thấy biến thể nguồn, mở lại món" };
  return {
    ok: true,
    draft: { ...draft, content: { ...draft.content, base: { ...toBase(variant, source_product_ref), set_updated_at: source_set_updated_at } } },
    sourceJourney: variant.journey,
    existingVariants: draft.kind === "VARIANT" && !draft.progress.claim
      ? detail.variants.flatMap(item => item.servings === null ? [] : [{ servings: item.servings, set_ref: item.set_ref, variant_label: item.variant_label }]) : [],
  };
}
