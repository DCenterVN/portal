import { listPackages, type FoodPackage, type FoodSlot } from "@/lib/api/sales";

export const FOOD_SLOTS: { id: FoodSlot; name: string }[] = [
  { id: "TINH_BOT", name: "Tinh bột" }, { id: "DAM", name: "Đạm" }, { id: "RAU", name: "Rau" },
  { id: "COT", name: "Cốt (gia vị)" }, { id: "NUOC_CHAM", name: "Nước chấm (gia vị)" }, { id: "GIA_VI_THEM", name: "Gia vị thêm" },
];
export const slotName = (slot: FoodSlot) => FOOD_SLOTS.find(item => item.id === slot)?.name;
export const packMessage = (error: unknown) => error instanceof Error ? error.message : "Không tải được dữ liệu";
export const isStale = (error: unknown) => (typeof error === "object" && error !== null && "status" in error && error.status === 409) || /409|stale|changed|conflict|đã.*đổi|xung đột/i.test(packMessage(error));

export async function loadPackOptions() {
  const items: FoodPackage[] = [];
  let cursor: string | undefined;
  do {
    const page = await listPackages({ cursor, limit: 100 });
    items.push(...page.items); cursor = page.next_cursor ?? undefined;
  } while (cursor);
  return items.filter(item => !["RETIRED", "ARCHIVED"].includes(item.status));
}
