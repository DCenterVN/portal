import type { MaterialCategory, Material, MaterialGroup, Status } from "@/lib/api/material-catalog";

export const PAGE_SIZE = 24;
export const SEARCH_DELAY_MS = 300;
export const UNCATEGORIZED = "chua-xep-loai";

export const STATUS_FILTERS = [
  { slug: "dang-dung", label: "Đang dùng", status: "ACTIVE" },
  { slug: "nhap", label: "Nháp", status: "DRAFT" },
  { slug: "da-ngung", label: "Đã ngừng", status: "SUSPENDED" },
] as const;
export type StatusFilter = (typeof STATUS_FILTERS)[number]["slug"];
export const statusOf = (slug: string): Status => (STATUS_FILTERS.find(item => item.slug === slug) ?? STATUS_FILTERS[0]).status;

export const fold = (text: string) => text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/gi, "d").toLowerCase();

export function suggestCode(name: string): string {
  return fold(name).replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "").toUpperCase();
}

export const groupsOf = (tree: MaterialCategory[], category: string): MaterialGroup[] => tree.find(item => item.code === category)?.groups.filter(item => item.active) ?? [];

export type CatalogState = { category: string; groups: string[]; page: number; q: string; statusFilter: StatusFilter };

export function readState(params: URLSearchParams, tree: MaterialCategory[]): CatalogState {
  const category = params.get("loai") === UNCATEGORIZED ? UNCATEGORIZED : tree.find(item => item.code === params.get("loai"))?.code ?? tree[0]?.code ?? "";
  const page = Math.max(1, Math.floor(Number(params.get("trang"))) || 1);
  const valid = groupsOf(tree, category).map(item => item.code);
  const groups = (params.get("nhom") ?? "").split(",").filter(code => valid.includes(code));
  const statusFilter = STATUS_FILTERS.find(item => item.slug === params.get("trang_thai"))?.slug ?? STATUS_FILTERS[0].slug;
  return { category, groups, page, q: params.get("q") ?? "", statusFilter };
}

export function stateQuery(state: CatalogState): string {
  const groups = state.groups.length ? `&nhom=${state.groups.join(",")}` : "";
  const statusFilter = state.statusFilter === STATUS_FILTERS[0].slug ? "" : `&trang_thai=${state.statusFilter}`;
  return `loai=${state.category}${groups}&${new URLSearchParams({ trang: String(state.page), q: state.q.trim() })}${statusFilter}`;
}

export function changeState(state: CatalogState, change: Partial<CatalogState>): CatalogState {
  const category = change.category ?? state.category;
  return { ...state, groups: category === state.category ? state.groups : [], page: 1, ...change };
}

export function countByCategory(items: Material[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const material of items) counts[material.category || UNCATEGORIZED] = (counts[material.category || UNCATEGORIZED] ?? 0) + 1;
  return counts;
}

export function countByCode(items: Material[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const material of items) for (const code of new Set([material.category, material.group])) if (code) counts[code] = (counts[code] ?? 0) + 1;
  return counts;
}

export function countByGroup(items: Material[], category: string, q = ""): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const material of filterMaterials(items, category, q)) counts[material.group] = (counts[material.group] ?? 0) + 1;
  return counts;
}

export const matchesName = (name: string, text: string) => {
  const folded = fold(name);
  return fold(text).split(/\s+/).filter(Boolean).every(word => folded.includes(word));
};

export function filterMaterials(items: Material[], category: string, q: string, groups: string[] = []): Material[] {
  return items.filter(material => (material.category || UNCATEGORIZED) === category && (!groups.length || groups.includes(material.group)) && matchesName(material.name, q));
}

export function pageCount(total: number): number {
  return Math.max(1, Math.ceil(total / PAGE_SIZE));
}

export function pageOf(items: Material[], current: number): Material[] {
  const page = Math.min(current, pageCount(items.length));
  return items.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
}

export function pageNumbers(current: number, total: number): (number | "gap")[] {
  const wanted = [...new Set([1, total, current - 1, current, current + 1])].filter(n => n >= 1 && n <= total).sort((a, b) => a - b);
  return wanted.flatMap((n, i) => (i > 0 && n - wanted[i - 1] > 1 ? ["gap" as const, n] : [n]));
}
