import { buildTableUrl, parseTableUrl, type TableUrlConfig, type TableUrlState } from "@/components/patterns/data-table/table-logic";
import { supplierListParams } from "@/lib/api/suppliers";

export const supplierTableConfig: TableUrlConfig = { filterKeys: ["status", "category", "priced", "attention"], pageSizes: [10, 20, 50], defaultPageSize: 10 };

export const todayVN = () => new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Ho_Chi_Minh" }).format(new Date());

export const supplierTableState = (search: URLSearchParams | string) => parseTableUrl(search, supplierTableConfig);

export const supplierListQuery = (state: TableUrlState) => ({
  q: state.q,
  status: state.filters.status?.[0] ?? "",
  categoryCode: state.filters.category?.[0] ?? "",
  pricedOn: state.filters.priced?.[0] === "today" ? todayVN() : "",
  page: state.page,
  limit: state.pageSize,
  sort: state.sort ? `${state.sort.desc ? "-" : ""}${state.sort.id}` : "",
  includeTotal: true,
});

export const supplierListKey = (state: TableUrlState) => supplierListParams(supplierListQuery(state)).toString();
export const supplierListUrl = (state: TableUrlState) => buildTableUrl(state, supplierTableConfig);
export const SUPPLIER_SORT_IDS = ["code", "name"];
