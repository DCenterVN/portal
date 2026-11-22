import type { Loai, Mon } from "@/lib/api/material-catalog";

export const TREE: Loai[] = [
  { code: "thit", label: "Thịt", active: true, nhom: [{ code: "lon", label: "Lợn", active: true }, { code: "bo", label: "Bò", active: true }, { code: "ga", label: "Gà", active: true }] },
  { code: "ca", label: "Cá", active: true, nhom: [{ code: "nuoc_ngot", label: "Cá nước ngọt", active: true }, { code: "bien", label: "Cá biển", active: true }] },
  { code: "rau", label: "Rau", active: true, nhom: [{ code: "rau_la", label: "Rau lá", active: true }, { code: "rau_thom", label: "Rau thơm", active: true }] },
  { code: "nam", label: "Nấm", active: true, nhom: [] },
];

const make = (n: number, loai: string, nhom: string, prefix: string): Mon[] =>
  Array.from({ length: n }, (_, i) => ({ id: `${nhom}-${i}`, ten: `${prefix} ${i + 1}`, loai, nhom, anh: null, status: "ACTIVE", donVi: "KG" }));

export const MONS: Mon[] = [
  ...make(20, "thit", "lon", "Thịt lợn"),
  ...make(10, "thit", "bo", "Thịt bò"),
  ...make(25, "rau", "rau_la", "Cải"),
  ...make(5, "rau", "rau_thom", "Húng"),
  ...make(4, "ca", "bien", "Cá biển"),
  { id: "x1", ten: "Cà chua", loai: "rau", nhom: "rau_la", anh: "http://x/a.webp", status: "ACTIVE", donVi: "KG" },
];
