import { parseTableUrl, type TableUrlConfig, type TableUrlState } from "@/components/patterns/data-table/table-logic";
import { locationParams } from "@/lib/api/storage-locations";

export const locationTableConfig: TableUrlConfig = { filterKeys: ["zone", "status"], pageSizes: [10, 20, 50], defaultPageSize: 20 };
export const locationTableState = (search: URLSearchParams | string) => parseTableUrl(search, locationTableConfig);

export const locationListQuery = (state: TableUrlState) => ({
  q: state.q,
  zone: state.filters.zone?.[0] ?? "",
  active: state.filters.status?.[0] === "ACTIVE" ? true : state.filters.status?.[0] === "INACTIVE" ? false : undefined,
  page: state.page,
  limit: state.pageSize,
});

export const locationListKey = (state: TableUrlState) => locationParams(locationListQuery(state)).toString();
