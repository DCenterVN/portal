const labels: Record<string, string> = {
  GLUTEN: "Gluten", CRUSTACEANS: "Giáp xác", EGGS: "Trứng", FISH: "Cá", PEANUTS: "Đậu phộng", SOYBEANS: "Đậu nành", MILK: "Sữa",
  TREE_NUTS: "Hạt có vỏ cứng", CELERY: "Cần tây", MUSTARD: "Mù tạt", SESAME: "Mè", SULPHITES: "Sunfit", LUPIN: "Đậu lupin", MOLLUSCS: "Nhuyễn thể",
};

export const allergenLabel = (code: string) => labels[code] ?? "Chất khác";

export function allergenSummary(perMaterial: (string[] | null)[]): string {
  if (perMaterial.length === 0) return "Chưa có nguyên liệu";
  const known = [...new Set(perMaterial.flatMap(list => list ?? []))].map(allergenLabel);
  const missing = perMaterial.some(list => list === null);
  if (known.length === 0) return missing ? "Chưa khai báo" : "Không có";
  return `${known.join(", ")}${missing ? " (còn nguyên liệu chưa khai báo)" : ""}`;
}
