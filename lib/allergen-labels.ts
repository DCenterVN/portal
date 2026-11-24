export const allergenLabels: Record<string, string> = {
  GLUTEN: "Gluten (lúa mì)", CRUSTACEANS: "Giáp xác (tôm, cua)", EGGS: "Trứng",
  FISH: "Cá", PEANUTS: "Đậu phộng", SOYBEANS: "Đậu nành", MILK: "Sữa",
  TREE_NUTS: "Hạt cây", CELERY: "Cần tây", MUSTARD: "Mù tạt", SESAME: "Vừng",
  SULPHITES: "Sulphite", LUPIN: "Đậu lupin", MOLLUSCS: "Nhuyễn thể (mực, nghêu)",
};

export const avoidanceLabels: Record<string, string> = {
  PORK: "Thịt heo", BEEF: "Thịt bò", ANIMAL: "Nguồn gốc động vật", ALCOHOL: "Rượu bia", MSG: "Bột ngọt", SPICY: "Cay", NGU_VI_TAN: "Ngũ vị tân",
};

export const flagLabel = (code: string) => allergenLabels[code] ?? avoidanceLabels[code] ?? code;

export function allergenText(value: string | null): string {
  if (value === null) return "Chưa khai báo";
  return value.split(",").map(item => allergenLabels[item.trim()] ?? item.trim()).join(", ");
}
