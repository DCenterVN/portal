import type { CreateFoodSetRequest, FoodSlot, SetSlot } from "@/lib/api/sales";

export const initialSetMetadata: CreateFoodSetRequest = { product_ref: "", code: "", name: "", variant_label: "2 người", net_weight_g: 100, uom_code: "EA", temperature_regime: "CHILLED", tags: [] };
export const normalizeFilterTag = (value: string) => value.trim().replace(/^#+/, "").trim().toLowerCase();
export const isSpice = (slot: FoodSlot) => ["COT", "NUOC_CHAM", "GIA_VI_THEM"].includes(slot);
export const parseTags = (text: string) => text.split(/[,\s]+/).filter(Boolean);

export function tagError(tags: string[], systemHashtags: string[] = []) {
  if (tags.length < 3 || tags.length > 8) return "Cần 3–8 hashtag.";
  if (new Set(tags).size !== tags.length) return "Hashtag bị trùng.";
  if (tags.some(tag => systemHashtags.includes(tag) || ["vegetarian", "vegan"].includes(tag))) return "Hashtag trùng hashtag hệ thống hoặc chế độ ăn.";
  if (tags.some(tag => !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(tag))) return "Hashtag chỉ dùng chữ thường không dấu, số và dấu gạch nối.";
  return "";
}
export const slotCountMessage = (slots: unknown[]) => slots.length < 2 || slots.length > 6 ? `Set cần 2–6 ô, đang có ${slots.length}` : "";
export const hasKeptSpice = (slots: SetSlot[]) => slots.some(slot => isSpice(slot.slot) && !slot.removable);
export const validSlotSet = (slots: SetSlot[]) => !slotCountMessage(slots) && hasKeptSpice(slots) && slots.every(slot => !(slot.slot === "COT" && slot.removable) && slot.options.length > 0 && slot.options.filter(option => option.is_default).length === 1 && (slot.swappable || slot.options.length === 1) && slot.options.every(option => Number.isInteger(option.quantity) && option.quantity > 0));
export const isLastKeptSpice = (slots: SetSlot[], slot: SetSlot) => isSpice(slot.slot) && !slot.removable && slots.filter(row => isSpice(row.slot) && !row.removable).length === 1;
