import type { MaterialCategory, Material } from "@/lib/api/material-catalog";

export const TREE: MaterialCategory[] = [
  { code: "thit", label: "Thịt", active: true, groups: [{ code: "lon", label: "Lợn", active: true }, { code: "bo", label: "Bò", active: true }, { code: "ga", label: "Gà", active: true }] },
  { code: "ca", label: "Cá", active: true, groups: [{ code: "nuoc_ngot", label: "Cá nước ngọt", active: true }, { code: "bien", label: "Cá biển", active: true }] },
  { code: "rau", label: "Rau", active: true, groups: [{ code: "rau_la", label: "Rau lá", active: true }, { code: "rau_thom", label: "Rau thơm", active: true }] },
  { code: "nam", label: "Nấm", active: true, groups: [] },
];

const make = (n: number, category: string, group: string, prefix: string): Material[] =>
  Array.from({ length: n }, (_, i) => ({ id: `${group}-${i}`, name: `${prefix} ${i + 1}`, category, group, imageUrl: null, status: "ACTIVE", unit: "KG" }));

export const MATERIALS: Material[] = [
  ...make(20, "thit", "lon", "Thịt lợn"),
  ...make(10, "thit", "bo", "Thịt bò"),
  ...make(25, "rau", "rau_la", "Cải"),
  ...make(5, "rau", "rau_thom", "Húng"),
  ...make(4, "ca", "bien", "Cá biển"),
  { id: "x1", name: "Cà chua", category: "rau", group: "rau_la", imageUrl: "http://x/a.webp", status: "ACTIVE", unit: "KG" },
];
