import { slotOf, type DishContent, type DraftKind, type GroupNode, type Journey } from "./types";
export type { DishContent } from "./types";
export type DishError = { row?: string; field: string; message: string; existing?: { set_ref: string; variant_label: string } };
export type ValidateCtx = { kind: DraftKind; tree: GroupNode[]; skuGroups: Record<string, string | null>; packagesWithRecipe: string[]; existingVariants: { servings: number; set_ref: string; variant_label: string }[]; source_journey?: Journey };
export function validateDish(content: DishContent, ctx: ValidateCtx): DishError[] {
  const errors: DishError[] = [];
  const add = (field: string, message: string, row?: string) => errors.push({ field, message, ...(row ? { row } : {}) });
  if (!content.name?.trim() || content.name.trim().length > 150) add("name", "Tên món cần 1–150 ký tự");
  if (!content.category_ref) add("category_ref", "Chọn danh mục món");
  if (content.tags.length < 3 || content.tags.length > 8) add("tags", "Nhập 3–8 hashtag");
  if (!content.servings || ![1, 2, 3, 4, 6].includes(content.servings)) add("servings", "Chọn khẩu phần 1, 2, 3, 4 hoặc 6 người");
  if (!content.ingredients.length) add("ingredients", "Thêm ít nhất một nguyên liệu");
  const seen = new Set<string>();
  const slots = new Set<string>();
  for (const line of content.ingredients) {
    if (!line.sku_ref || seen.has(line.sku_ref)) add("sku_ref", line.sku_ref ? "Nguyên liệu đã có ở dòng trước" : "Chọn nguyên liệu", line.row);
    if (line.sku_ref) { seen.add(line.sku_ref); slots.add(slotOf(ctx.skuGroups[line.sku_ref] ?? null, ctx.tree)); }
    if (!/^\d+(\.\d{1,3})?$/.test(line.quantity) || Number(line.quantity) <= 0) add("quantity", "Lượng phải lớn hơn 0, tối đa 3 số lẻ", line.row);
    if (!line.yield_pct.trim() || !Number.isFinite(Number(line.yield_pct)) || Number(line.yield_pct) < 1 || Number(line.yield_pct) > 100) add("yield_pct", "Hao hụt cần từ 0 đến 99%", line.row);
  }
  if (!content.seasonings.some(line => line.package_ref && !line.removable)) add("removable", "Món cần ít nhất một gói gia vị không được bỏ", content.seasonings[0]?.row);
  for (const line of content.seasonings) {
    if (slots.has(line.slot)) add("package_ref", "Mỗi loại ô gia vị chỉ có một dòng", line.row);
    slots.add(line.slot);
    if (line.slot === "COT" && line.removable) add("removable", "Cốt không được bỏ", line.row);
    if (!line.package_ref || !ctx.packagesWithRecipe.includes(line.package_ref)) add("package_ref", "Chọn gói có công thức hiệu lực cho 1 suất", line.row);
  }
  if (slots.size < 2 || slots.size > 6) add("slots", "Món cần 2–6 ngăn đóng gói");
  if (ctx.kind === "REVISION") {
    if (!content.reason?.trim() || content.reason.trim().length > 300) add("reason", "Lý do sửa cần 1–300 ký tự");
    if (ctx.source_journey === "SELLING") add("base", "Biến thể đang bán — tạo biến thể mới hoặc chờ đợt mở/ngừng bán");
  }
  const existing = ctx.kind === "VARIANT" && ctx.existingVariants.find(item => item.servings === content.servings);
  if (existing) errors.push({ field: "servings", message: "Món đã có biến thể cùng khẩu phần", existing: { set_ref: existing.set_ref, variant_label: existing.variant_label } });
  return errors;
}
