export type SortState = { id: string; desc: boolean } | null;

export type TableUrlState = {
  q: string;
  pageSize: number;
  page: number;
  cursors: string[];
  sort: SortState;
  filters: Record<string, string[]>;
};

export type TableUrlConfig = { filterKeys: string[]; pageSizes: number[]; defaultPageSize: number };

const collator = new Intl.Collator("vi", { numeric: true, sensitivity: "base" });

type SortKey = string | number | null | undefined;

function compare(a: SortKey, b: SortKey) {
  if (typeof a === "number" && typeof b === "number") return a - b;
  return collator.compare(String(a), String(b));
}

export function sortRows<T>(rows: T[], value: (row: T) => SortKey, desc: boolean) {
  const empty = (row: T) => value(row) === null || value(row) === undefined || value(row) === "";
  const filled = rows.filter(row => !empty(row)).sort((a, b) => (desc ? -1 : 1) * compare(value(a), value(b)));
  return [...filled, ...rows.filter(empty)];
}

export const pageCount = (total: number, pageSize: number) => Math.max(1, Math.ceil(total / pageSize));

export function sliceRows<T>(rows: T[], page: number, pageSize: number) {
  const current = Math.min(Math.max(1, page), pageCount(rows.length, pageSize));
  return rows.slice((current - 1) * pageSize, current * pageSize);
}

type Position = { page: number; pageSize: number; count?: number; total?: number };

export function footerText({ page, pageSize, count = pageSize, total }: Position) {
  if (total === 0 || count === 0) return `Hiển thị 0 trong ${total ?? 0}`;
  const from = (page - 1) * pageSize + 1;
  const range = `Hiển thị ${from}–${from + count - 1}`;
  return total === undefined ? range : `${range} trong ${total}`;
}

export const pageText = ({ page, pageSize, total }: Position) => total === undefined ? `Trang ${page}` : `Trang ${page} trên ${pageCount(total, pageSize)}`;

export const toggleHidden = (hidden: string[], id: string) => hidden.includes(id) ? hidden.filter(item => item !== id) : [...hidden, id];

export const visibleColumns = <C extends { id: string; hideable?: boolean }>(columns: C[], hidden: string[]) => columns.filter(column => !column.hideable || !hidden.includes(column.id));

export function parseTableUrl(search: string | URLSearchParams, config: TableUrlConfig): TableUrlState {
  const params = typeof search === "string" ? new URLSearchParams(search) : search;
  const size = Number(params.get("size"));
  const page = Number(params.get("page"));
  const sortRaw = params.get("sort") ?? "";
  const sortId = sortRaw.replace(/^-/, "");
  const filters: Record<string, string[]> = {};
  for (const key of config.filterKeys) {
    const values = params.getAll(`f.${key}`).filter(Boolean);
    if (values.length) filters[key] = values;
  }
  return {
    q: params.get("q") ?? "",
    pageSize: config.pageSizes.includes(size) ? size : config.defaultPageSize,
    page: Number.isInteger(page) && page > 1 ? page : 1,
    cursors: parseCursors(params.get("cursors")),
    sort: sortId ? { id: sortId, desc: sortRaw.startsWith("-") } : null,
    filters,
  };
}

function parseCursors(raw: string | null) {
  try {
    const value: unknown = JSON.parse(raw ?? "[]");
    return Array.isArray(value) && value.every(item => typeof item === "string" && item) ? value : [];
  } catch {
    return [];
  }
}

export function buildTableUrl(state: TableUrlState, config: TableUrlConfig) {
  const params = new URLSearchParams();
  if (state.q) params.set("q", state.q);
  if (state.pageSize !== config.defaultPageSize) params.set("size", String(state.pageSize));
  if (state.sort) params.set("sort", `${state.sort.desc ? "-" : ""}${state.sort.id}`);
  if (state.page > 1) params.set("page", String(state.page));
  if (state.cursors.length) params.set("cursors", JSON.stringify(state.cursors));
  for (const key of config.filterKeys) for (const value of state.filters[key] ?? []) params.append(`f.${key}`, value);
  return params.toString();
}

const firstPage = (state: TableUrlState): TableUrlState => ({ ...state, page: 1, cursors: [] });

export const withQuery = (state: TableUrlState, q: string) => ({ ...firstPage(state), q });
export const withSort = (state: TableUrlState, sort: SortState) => ({ ...firstPage(state), sort });
export const withPageSize = (state: TableUrlState, pageSize: number) => ({ ...firstPage(state), pageSize });
export const clampPage = (page: number, total: number, pageSize: number) => Math.min(Math.max(1, Math.trunc(page) || 1), pageCount(total, pageSize));
export function commitPageText(text: string, page: number, pages: number, onPage: (page: number) => void) {
  const value = text.trim();
  if (!/^\d+$/.test(value)) return String(page);
  const target = clampPage(Number(value), pages, 1);
  if (target !== page) onPage(target);
  return String(target);
}

export const withPage = (state: TableUrlState, page: number) => ({ ...state, cursors: [], page: Math.max(1, page) });
export const withNextCursor = (state: TableUrlState, cursor: string) => cursor ? { ...state, cursors: [...state.cursors, cursor] } : state;
export const withPreviousCursor = (state: TableUrlState) => ({ ...state, cursors: state.cursors.slice(0, -1) });
export const withFirstPage = firstPage;

export function withFilter(state: TableUrlState, key: string, values: string[]) {
  const filters = { ...state.filters };
  if (values.length) filters[key] = values;
  else delete filters[key];
  return { ...firstPage(state), filters };
}

export const clearFilters = (state: TableUrlState): TableUrlState => ({ ...firstPage(state), q: "", filters: {} });
