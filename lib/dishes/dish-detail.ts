import { normalizeRecipeLine } from "./ingredients";
import { parseVariantLabel, type DishBase, type DraftRow, type IngredientSlot, type Journey, type Line, type SeaSlot } from "./types";
export type Product = { id: string; name: string; slug: string; category_ref: string | null; category_name?: string; status: string; image_urls?: string[]; updated_at?: string };
export type SetDetail = { id: string; name?: string; variant_label: string; status: string; sellable: boolean; updated_at: string; tags?: string[]; slots: { slot: string; swappable?: boolean; removable: boolean; options: { sku_ref: string; quantity?: number; is_default: boolean }[] }[] };
export type VariantSeasoning = { slot: SeaSlot; package_ref: string; package_name: string; removable: boolean; components?: Line[] };
export type Variant = { set_ref: string; name?: string; variant_label: string; servings: number | null; variant_note?: string | null; journey: Journey; updated_at: string; tags?: string[]; packs: { slot: IngredientSlot; package_ref: string; package_name: string; lines: Line[] }[]; seasonings: VariantSeasoning[] };
export type DetailDeps = {
  getProduct(id: string): Promise<Product>; listVariants(id: string): Promise<SetDetail[]>;
  getPackage(id: string): Promise<{ id: string; code?: string; name: string }>; getActiveRecipe(id: string): Promise<{ components: Line[] } | null>;
  listDrafts(query: { product_ref: string; status: "OPEN" | "COMPLETED"; kind?: string }): Promise<DraftRow[]>;
};
export type DishDetail = { product: Product; variants: Variant[]; open_drafts: DraftRow[]; revision_history: { id: string; completed_at: string | null; updated_by: string; reason: string | null }[] };
const PACK_SLOTS = new Set<string>(["DAM", "RAU", "TINH_BOT", "COT", "GIA_VI_THEM"]);
const SEASONING_SLOTS = new Set<string>(["COT", "NUOC_CHAM", "GIA_VI_THEM", "DO_CHUA"]);

export function buildDishDetail(input: { product: Product; variants: SetDetail[]; packageNames: Record<string, string>; packageCodes?: Record<string, string>; recipes: Record<string, { components: Line[] } | null>; openDrafts: DraftRow[]; revisions: DraftRow[] }): DishDetail {
  const variants = input.variants.map((set): Variant => {
    const parsedLabel = parseVariantLabel(set.variant_label);
    const variant: Variant = { set_ref: set.id, ...(set.name ? { name: set.name } : {}), variant_label: set.variant_label, servings: parsedLabel.servings, variant_note: parsedLabel.variant_note, journey: set.status === "DRAFT" ? "DRAFT" : set.sellable ? "SELLING" : set.status === "ACTIVE" ? "DONE" : "STOPPED", updated_at: set.updated_at, ...(set.tags ? { tags: set.tags } : {}), packs: [], seasonings: [] };
    for (const slot of set.slots) {
      const option = slot.options.find(item => item.is_default) ?? slot.options[0];
      if (!option) continue;
      const pack = { package_ref: option.sku_ref, package_name: input.packageNames[option.sku_ref] ?? "Gói chưa tải được tên" };
      const components = input.recipes[option.sku_ref]?.components;
      const lines = (components ?? []).map(normalizeRecipeLine);
      const code = input.packageCodes?.[option.sku_ref] ?? "";
      const isDishRawPack = code
        ? code.startsWith("D-") && PACK_SLOTS.has(slot.slot)
        : slot.slot === "DAM" || slot.slot === "RAU" || slot.slot === "TINH_BOT" || ((slot.slot === "COT" || slot.slot === "GIA_VI_THEM") && Boolean(components?.length));
      if (isDishRawPack) {
        variant.packs.push({ ...pack, slot: slot.slot as IngredientSlot, lines });
      } else if (SEASONING_SLOTS.has(slot.slot)) {
        variant.seasonings.push({ ...pack, slot: slot.slot as SeaSlot, removable: slot.removable, ...(lines.length ? { components: lines } : {}) });
      }
    }
    return variant;
  });
  return { product: input.product, variants, open_drafts: input.openDrafts, revision_history: input.revisions.map(row => ({ id: row.id, completed_at: row.completed_at ?? null, updated_by: row.updated_by, reason: row.reason ?? null })) };
}
export async function loadDishDetail(id: string, deps: DetailDeps): Promise<DishDetail> {
  const [product, variants, openDrafts, revisions] = await Promise.all([deps.getProduct(id), deps.listVariants(id), deps.listDrafts({ product_ref: id, status: "OPEN" }), deps.listDrafts({ product_ref: id, status: "COMPLETED", kind: "REVISION" })]);
  const ids = [...new Set(variants.flatMap(set => set.slots.flatMap(slot => slot.options.map(option => option.sku_ref))))];
  const packages = await Promise.all(ids.map(id => deps.getPackage(id)));
  const recipes = await Promise.all(ids.map(async id => [id, await deps.getActiveRecipe(id)] as const));
  return buildDishDetail({
    product,
    variants,
    openDrafts,
    revisions,
    packageNames: Object.fromEntries(packages.map(pack => [pack.id, pack.name])),
    packageCodes: Object.fromEntries(packages.map(pack => [pack.id, pack.code ?? ""])),
    recipes: Object.fromEntries(recipes),
  });
}
export function toBase(variant: Variant, product_ref: string): DishBase {
  return { product_ref, set_ref: variant.set_ref, set_updated_at: variant.updated_at, slots: Object.fromEntries(variant.packs.map(pack => [pack.slot, { package_ref: pack.package_ref, lines: pack.lines.map(({ sku_ref, quantity, uom, yield_pct, prep_note }) => ({ sku_ref, quantity, uom, yield_pct, ...(prep_note ? { prep_note } : {}) })) }])) };
}
