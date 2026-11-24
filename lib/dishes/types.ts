export type Slot3 = "DAM" | "RAU" | "TINH_BOT";
export type IngredientSlot = Slot3 | "COT" | "GIA_VI_THEM";
export type SeaSlot = "COT" | "NUOC_CHAM" | "GIA_VI_THEM";
export type Journey = "DRAFT" | "DONE" | "SELLING" | "STOPPED";
export type DraftKind = "CREATE" | "COPY" | "VARIANT" | "REVISION";
export const SERVING_OPTIONS = [1, 2, 3, 4, 6] as const;
export const draftKindLabels: Record<DraftKind, string> = { CREATE: "Món mới", COPY: "Nhân bản", VARIANT: "Biến thể", REVISION: "Bản sửa" };
export const journeyLabels: Record<Journey, string> = { DRAFT: "Chưa hoàn tất", DONE: "Đã hoàn tất", SELLING: "Đang bán", STOPPED: "Ngừng" };
export type GroupNode = { code: string; parent_code: string | null };
export type Line = { sku_ref: string; quantity: string; uom: string; yield_pct: string };
export type DishBase = { product_ref: string; set_ref: string; set_updated_at: string; slots: Partial<Record<IngredientSlot, { package_ref: string; lines: Line[] }>> };
export type DishContent = {
  schema_version: 1; name: string | null; category_ref: string | null; tags: string[];
  servings: number | null; ingredients: (Omit<Line, "sku_ref"> & { row: string; sku_ref: string | null })[];
  seasonings: { row: string; slot: SeaSlot; package_ref: string | null; removable: boolean }[];
  reason: string | null; base: DishBase | null;
};
export type DraftRow = { id: string; kind: string; status: string; title?: string | null; revision?: number; updated_by: string; updated_at: string; completed_at?: string | null; reason?: string | null };
export type DishDraft = { id: string; kind: DraftKind; revision: number; content: DishContent; progress: Record<string, string>; status?: string; source_product_ref?: string | null; source_set_ref?: string | null; product_ref?: string | null; set_ref?: string | null };
export const slotLabels: Record<Slot3 | SeaSlot, string> = { DAM: "Đạm", RAU: "Rau", TINH_BOT: "Tinh bột", COT: "Cốt nước dùng", NUOC_CHAM: "Nước chấm", GIA_VI_THEM: "Gia vị" };
const damRoots = ["THIT", "CA_LOAI", "THUY_HAI_SAN", "TRUNG_SUA", "DO_CHE_BIEN"];
export const slotOfRoot = (code: string): IngredientSlot => damRoots.includes(code) ? "DAM" : code === "GAO_NGU_COC" ? "TINH_BOT" : code === "GIA_VI" ? "GIA_VI_THEM" : code === "COT_NUOC_DUNG" ? "COT" : "RAU";
export function slotOf(groupCode: string | null, tree: GroupNode[]): IngredientSlot {
  let code = groupCode;
  const visited = new Set<string>();
  while (code && !visited.has(code)) {
    visited.add(code);
    const node = tree.find(item => item.code === code);
    if (!node) return "RAU";
    if (node.parent_code) { code = node.parent_code; continue; }
    return slotOfRoot(code);
  }
  return "RAU";
}

export type DishListRow = { product: { id: string; name: string; category_ref: string | null; category_name: string; image_urls?: string[]; updated_at?: string }; variants: { set_ref: string; variant_label: string; journey: Journey }[]; counts: Record<Journey, number>; open_revision_drafts: number };
export type CostPreview = { complete: boolean; total_vnd: number; per_serving_vnd: number; lines: { sku_ref: string; name: string; quantity: string; uom: string; cost_vnd: number | null; missing: string | null; from?: string; package_ref?: string | null }[] };
