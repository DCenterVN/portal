import type { Loai, Mon, Nhom, Status } from "@/lib/api/material-catalog";

export const PAGE_SIZE = 24;
export const SEARCH_DELAY_MS = 300;
export const CHUA_XEP = "chua-xep-loai";

export const TRANG_THAI = [
  { slug: "dang-dung", label: "Đang dùng", status: "ACTIVE" },
  { slug: "nhap", label: "Nháp", status: "DRAFT" },
  { slug: "da-ngung", label: "Đã ngừng", status: "SUSPENDED" },
] as const;
export type TrangThai = (typeof TRANG_THAI)[number]["slug"];
export const statusOf = (slug: string): Status => (TRANG_THAI.find(item => item.slug === slug) ?? TRANG_THAI[0]).status;

export const fold = (text: string) => text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/gi, "d").toLowerCase();

export function suggestCode(name: string): string {
  return fold(name).replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "").toUpperCase();
}

export const nhomOf = (tree: Loai[], loai: string): Nhom[] => tree.find(item => item.code === loai)?.nhom.filter(item => item.active) ?? [];

export type CatalogState = { loai: string; nhom: string[]; trang: number; q: string; trangThai: TrangThai };

export function readState(params: URLSearchParams, tree: Loai[]): CatalogState {
  const loai = params.get("loai") === CHUA_XEP ? CHUA_XEP : tree.find(item => item.code === params.get("loai"))?.code ?? tree[0]?.code ?? "";
  const trang = Math.max(1, Math.floor(Number(params.get("trang"))) || 1);
  const valid = nhomOf(tree, loai).map(item => item.code);
  const nhom = (params.get("nhom") ?? "").split(",").filter(code => valid.includes(code));
  const trangThai = TRANG_THAI.find(item => item.slug === params.get("trang_thai"))?.slug ?? TRANG_THAI[0].slug;
  return { loai, nhom, trang, q: params.get("q") ?? "", trangThai };
}

export function stateQuery(state: CatalogState): string {
  const nhom = state.nhom.length ? `&nhom=${state.nhom.join(",")}` : "";
  const trangThai = state.trangThai === TRANG_THAI[0].slug ? "" : `&trang_thai=${state.trangThai}`;
  return `loai=${state.loai}${nhom}&${new URLSearchParams({ trang: String(state.trang), q: state.q.trim() })}${trangThai}`;
}

export function changeState(state: CatalogState, change: Partial<CatalogState>): CatalogState {
  const loai = change.loai ?? state.loai;
  return { ...state, nhom: loai === state.loai ? state.nhom : [], trang: 1, ...change };
}

export function countByLoai(items: Mon[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const mon of items) counts[mon.loai || CHUA_XEP] = (counts[mon.loai || CHUA_XEP] ?? 0) + 1;
  return counts;
}

export function countByNhom(items: Mon[], loai: string, q = ""): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const mon of filterMon(items, loai, q)) counts[mon.nhom] = (counts[mon.nhom] ?? 0) + 1;
  return counts;
}

export function filterMon(items: Mon[], loai: string, q: string, nhom: string[] = []): Mon[] {
  const needle = fold(q.trim());
  return items.filter(mon => (mon.loai || CHUA_XEP) === loai && (!nhom.length || nhom.includes(mon.nhom)) && fold(mon.ten).includes(needle));
}

export function pageCount(total: number): number {
  return Math.max(1, Math.ceil(total / PAGE_SIZE));
}

export function pageOf(items: Mon[], trang: number): Mon[] {
  const page = Math.min(trang, pageCount(items.length));
  return items.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
}

export function pageNumbers(current: number, total: number): (number | "gap")[] {
  const wanted = [...new Set([1, total, current - 1, current, current + 1])].filter(n => n >= 1 && n <= total).sort((a, b) => a - b);
  return wanted.flatMap((n, i) => (i > 0 && n - wanted[i - 1] > 1 ? ["gap" as const, n] : [n]));
}
