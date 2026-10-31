export type Slot3 = "DAM" | "RAU" | "TINH_BOT";
export type SeaSlot = "COT" | "NUOC_CHAM" | "GIA_VI_THEM";
export type Journey = "DRAFT" | "DONE" | "SELLING" | "STOPPED";
export type DraftKind = "CREATE" | "COPY" | "VARIANT" | "REVISION";
export type GroupNode = { code: string; parent_code: string | null };
export type Line = { sku_ref: string; quantity: string; uom: string; yield_pct: string };
export type DishBase = { product_ref: string; set_ref: string; set_updated_at: string; slots: Partial<Record<Slot3, { package_ref: string; lines: Line[] }>> };
export type DishContent = {
  schema_version: 1; name: string | null; category_ref: string | null; tags: string[];
  servings: number | null; ingredients: (Omit<Line, "sku_ref"> & { row: string; sku_ref: string | null })[];
  seasonings: { row: string; slot: SeaSlot; package_ref: string | null; removable: boolean }[];
  reason: string | null; base: DishBase | null;
};
export type DraftRow = { id: string; kind: string; status: string; title?: string | null; revision?: number; updated_by: string; updated_at: string; completed_at?: string | null; reason?: string | null };
export type DishDraft = { id: string; kind: DraftKind; revision: number; content: DishContent; progress: Record<string, string>; status?: string };
export const slotLabels: Record<Slot3 | SeaSlot, string> = { DAM: "Đạm", RAU: "Rau", TINH_BOT: "Tinh bột", COT: "Cốt", NUOC_CHAM: "Nước chấm", GIA_VI_THEM: "Gia vị thêm" };
export function slotOf(groupCode: string | null, tree: GroupNode[]): Slot3 {
  let code = groupCode;
  const visited = new Set<string>();
  while (code && !visited.has(code)) {
    visited.add(code);
    const node = tree.find(item => item.code === code);
    if (!node) return "RAU";
    if (node.parent_code) { code = node.parent_code; continue; }
    if (["THIT", "THUY_HAI_SAN", "TRUNG_SUA", "DO_CHE_BIEN"].includes(code)) return "DAM";
    return code === "GAO_NGU_COC" ? "TINH_BOT" : "RAU";
  }
  return "RAU";
}

export type DishListRow = { product: { id: string; name: string; category_ref: string | null; category_name: string }; variants: { set_ref: string; variant_label: string; journey: Journey }[]; counts: Record<Journey, number>; open_revision_drafts: number };
export type PackOption = { id: string; name: string; status: string };
export type CostPreview = { complete: boolean; total_vnd: number; per_serving_vnd: number; lines: { sku_ref: string; name: string; quantity: string; uom: string; cost_vnd: number | null; missing: string | null }[] };
