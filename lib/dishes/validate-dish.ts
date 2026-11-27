import { MAX_PREP_NOTE_LENGTH, MAX_VARIANT_NOTE_LENGTH, SERVING_OPTIONS, slotOf, variantKey, type DishContent, type DraftKind, type GroupNode, type Journey } from "./types";
export type { DishContent } from "./types";
export type DishError = { row?: string; field: string; message: string; existing?: { set_ref: string; variant_label: string } };
export type ValidateCtx = {
  kind: DraftKind;
  tree: GroupNode[];
  skuGroups: Record<string, string | null>;
  inactiveSkus?: Record<string, "DRAFT" | "SUSPENDED" | "MISSING">;
  packagesWithRecipe: string[];
  existingVariants: { servings: number; variant_note?: string | null; set_ref: string; variant_label: string }[];
  source_journey?: Journey;
};
export function validateDish(content: DishContent, ctx: ValidateCtx): DishError[] {
  const errors: DishError[] = [];
  const add = (field: string, message: string, row?: string) => errors.push({ field, message, ...(row ? { row } : {}) });
  const trimmedName = content.name?.trim() ?? "";
  if (!trimmedName || trimmedName.length > 150) add("name", "Nhập tên món (tối đa 150 ký tự)");
  else if (/\(bản sao\)\s*$/i.test(trimmedName)) add("name", "Đổi tên món trước khi hoàn tất");
  const trimmedNote = content.variant_note?.trim() ?? "";
  if ([...trimmedNote].length > MAX_VARIANT_NOTE_LENGTH) add("variant_note", `Nhãn biến thể tối đa ${MAX_VARIANT_NOTE_LENGTH} ký tự`);
  if (content.tags.length < 3 || content.tags.length > 8) add("tags", "Nhập 3–8 hashtag");
  if (!content.servings || !(SERVING_OPTIONS as readonly number[]).includes(content.servings)) add("servings", "Chọn số suất mỗi hộp");
  if (!content.ingredients.length) add("ingredients", "Thêm ít nhất một nguyên liệu");
  const seen = new Set<string>();
  const slots = new Set<string>();
  for (const line of content.ingredients) {
    if (!line.sku_ref || seen.has(line.sku_ref)) add("sku_ref", line.sku_ref ? "Nguyên liệu đã có ở dòng trước" : "Chọn nguyên liệu", line.row);
    if (line.sku_ref) seen.add(line.sku_ref);
    const inactive = line.sku_ref ? ctx.inactiveSkus?.[line.sku_ref] : undefined;
    if (inactive === "SUSPENDED") add("sku_ref", "Nguyên liệu đã ngừng dùng — đổi sang nguyên liệu đang dùng", line.row);
    else if (inactive === "DRAFT") add("sku_ref", "Nguyên liệu đang là nháp — duyệt nguyên liệu trước khi hoàn tất món", line.row);
    else if (inactive === "MISSING") add("sku_ref", "Nguyên liệu không còn trong danh mục — xoá dòng này hoặc chọn nguyên liệu khác", line.row);
    if (line.sku_ref && !inactive) {
      const group = ctx.skuGroups[line.sku_ref];
      if (!group || !ctx.tree.some(node => node.code === group)) add("sku_ref", "Nguyên liệu chưa thuộc nhóm hợp lệ — gán nhóm ở kho trước khi hoàn tất", line.row);
      else slots.add(slotOf(group, ctx.tree));
    }
    if (!/^\d+(\.\d{1,3})?$/.test(line.quantity) || Number(line.quantity) <= 0) add("quantity", "Nhập lượng lớn hơn 0 (tối đa 3 chữ số thập phân)", line.row);
    if (!line.yield_pct.trim() || !Number.isFinite(Number(line.yield_pct)) || Number(line.yield_pct) < 1 || Number(line.yield_pct) > 100) add("yield_pct", "Tỷ lệ thu hồi cần từ 1 đến 100%", line.row);
    if (line.prep_note) {
      if ([...line.prep_note].some(ch => { const code = ch.charCodeAt(0); return code < 0x20 || code === 0x7f; })) add("prep_note", "Ghi chú sơ chế không chứa ký tự điều khiển", line.row);
      else if ([...line.prep_note.trim()].length > MAX_PREP_NOTE_LENGTH) add("prep_note", `Ghi chú sơ chế tối đa ${MAX_PREP_NOTE_LENGTH} ký tự`, line.row);
    }
  }
  if (!slots.has("GIA_VI_THEM") && !slots.has("COT") && !content.seasonings.some(line => line.package_ref && !line.removable && line.slot !== "DO_CHUA")) add("removable", "Món cần ít nhất một gia vị hoặc một cốt nước dùng", content.seasonings[0]?.row);
  for (const line of content.seasonings) {
    if (slots.has(line.slot)) add("package_ref", "Nhóm này đã có nguyên liệu, bỏ gói gia vị cũ hoặc bỏ nguyên liệu cùng nhóm", line.row);
    slots.add(line.slot);
    if (line.slot === "COT" && line.removable) add("removable", "Cốt không được bỏ", line.row);
    if (!line.package_ref || !ctx.packagesWithRecipe.includes(line.package_ref)) add("package_ref", "Chọn gói có công thức hiệu lực cho 1 suất", line.row);
  }
  if (slots.size < 2) add("slots", "Món cần nguyên liệu ở ít nhất hai nhóm, ví dụ đạm và gia vị");
  if (ctx.kind === "REVISION") {
    if (!content.reason?.trim() || content.reason.trim().length > 300) add("reason", "Nhập lý do sửa món");
    if (ctx.source_journey === "SELLING") add("base", "Biến thể đang bán — tạo biến thể mới hoặc chờ đợt mở/ngừng bán");
  }
  const targetKey = variantKey(content.servings, content.variant_note);
  const existing = ctx.kind === "VARIANT" && ctx.existingVariants.find(item => variantKey(item.servings, item.variant_note) === targetKey);
  if (existing) errors.push({ field: "servings", message: "Món đã có biến thể cùng nhãn", existing: { set_ref: existing.set_ref, variant_label: existing.variant_label } });
  return errors;
}
