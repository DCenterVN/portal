"use client";

import * as React from "react";
import type { Route } from "next";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { buildTableUrl, clearFilters, parseTableUrl, withFilter, withFirstPage, withNextCursor, withPage, withPageSize, withPreviousCursor, withQuery, withSort, type SortState, type TableUrlConfig, type TableUrlState } from "./table-logic";

const searchDelay = 300;

export function useTableUrlState(config: TableUrlConfig) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const state = React.useMemo(() => parseTableUrl(params, config), [params, config]);
  const latest = React.useRef(state);
  latest.current = state;
  const [typed, setTyped] = React.useState<string | null>(null);
  const timer = React.useRef<ReturnType<typeof setTimeout>>(undefined);

  const commit = React.useCallback((next: TableUrlState) => {
    latest.current = next;
    const query = buildTableUrl(next, config);
    router.replace((query ? `${pathname}?${query}` : pathname) as Route, { scroll: false });
  }, [config, pathname, router]);

  React.useEffect(() => () => clearTimeout(timer.current), []);
  React.useEffect(() => setTyped(null), [state.q]);

  const setQuery = (q: string) => {
    setTyped(q);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => commit(withQuery(latest.current, q)), searchDelay);
  };

  return {
    state,
    query: typed ?? state.q,
    setQuery,
    setFilter: (key: string, values: string[]) => commit(withFilter(latest.current, key, values)),
    setSort: (sort: SortState) => commit(withSort(latest.current, sort)),
    setPageSize: (size: number) => commit(withPageSize(latest.current, size)),
    setPage: (page: number) => commit(withPage(latest.current, page)),
    nextCursor: (cursor: string) => commit(withNextCursor(latest.current, cursor)),
    previousCursor: () => commit(withPreviousCursor(latest.current)),
    firstPage: () => commit(withFirstPage(latest.current)),
    clear: () => { setTyped(""); commit(clearFilters(latest.current)); },
    cursor: state.cursors[state.cursors.length - 1] ?? "",
    cursorPage: state.cursors.length + 1,
  };
}
