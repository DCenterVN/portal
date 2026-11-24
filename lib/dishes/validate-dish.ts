import { SERVING_OPTIONS, slotOf, type DishContent, type DraftKind, type GroupNode, type Journey } from "./types";
export type { DishContent } from "./types";
export type DishError = { row?: string; field: string; message: string; existing?: { set_ref: string; variant_label: string } };
export type ValidateCtx = { kind: DraftKind; tree: GroupNode[]; skuGroups: Record<string, string | null>; inactiveSkus?: Record<string, "DRAFT" | "SUSPENDED">; packagesWithRecipe: string[]; existingVariants: { servings: number; set_ref: string; variant_label: string }[]; source_journey?: Journey };
export function validateDish(content: DishContent, ctx: ValidateCtx): DishError[] {
  const errors: DishError[] = [];
  const add = (field: string, message: string, row?: string) => errors.push({ field, message, ...(row ? { row } : {}) });
  const trimmedName = content.name?.trim() ?? "";
  if (!trimmedName || trimmedName.length > 150) add("name", "Nhập tên món (tối đa 150 ký tự)");
  else if (/\(bản sao\)\s*$/i.test(trimmedName)) add("name", "Đổi tên món trước khi hoàn tất");
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
    if (line.sku_ref && !inactive) {
      const group = ctx.skuGroups[line.sku_ref];
      if (!group || !ctx.tree.some(node => node.code === group)) add("sku_ref", "Nguyên liệu chưa thuộc nhóm hợp lệ — gán nhóm ở kho trước khi hoàn tất", line.row);
      else slots.add(slotOf(group, ctx.tree));
    }
    if (!/^\d+(\.\d{1,3})?$/.test(line.quantity) || Number(line.quantity) <= 0) add("quantity", "Nhập lượng lớn hơn 0 (tối đa 3 chữ số thập phân)", line.row);
    if (!line.yield_pct.trim() || !Number.isFinite(Number(line.yield_pct)) || Number(line.yield_pct) < 1 || Number(line.yield_pct) > 100) add("yield_pct", "Hao hụt cần từ 0 đến 99%", line.row);
  }
  if (!slots.has("GIA_VI_THEM") && !slots.has("COT") && !content.seasonings.some(line => line.package_ref && !line.removable)) add("removable", "Món cần ít nhất một gia vị hoặc một cốt nước dùng", content.seasonings[0]?.row);
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
  const existing = ctx.kind === "VARIANT" && ctx.existingVariants.find(item => item.servings === content.servings);
  if (existing) errors.push({ field: "servings", message: "Món đã có biến thể cùng khẩu phần", existing: { set_ref: existing.set_ref, variant_label: existing.variant_label } });
  return errors;
}
