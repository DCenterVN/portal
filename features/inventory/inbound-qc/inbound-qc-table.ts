import { parseTableUrl, type TableUrlConfig, type TableUrlState } from "@/components/patterns/data-table/table-logic";
import { inboundLotParams } from "@/lib/api/inbound-qc";

export const DEFAULT_LOT_STATUS = "RECEIVED";
export const DEFAULT_LOT_STATUSES = [DEFAULT_LOT_STATUS];
export const lotTableConfig: TableUrlConfig = { filterKeys: ["status"], pageSizes: [10, 20, 50], defaultPageSize: 10 };
export const lotTableState = (search: URLSearchParams | string) => parseTableUrl(search, lotTableConfig);

export const lotListQuery = (state: TableUrlState) => ({ status: state.filters.status?.[0] || DEFAULT_LOT_STATUS, q: state.q, page: state.page, limit: state.pageSize });
export const lotListKey = (state: TableUrlState) => inboundLotParams(lotListQuery(state)).toString();
