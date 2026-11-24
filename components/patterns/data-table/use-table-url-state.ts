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
  const [typed, setTyped] = React.useState<string | null>(null);
  const timer = React.useRef<ReturnType<typeof setTimeout>>(undefined);

  const commit = React.useCallback((next: TableUrlState) => {
    const query = buildTableUrl(next, config);
    router.replace((query ? `${pathname}?${query}` : pathname) as Route, { scroll: false });
  }, [config, pathname, router]);

  React.useEffect(() => () => clearTimeout(timer.current), []);
  React.useEffect(() => setTyped(null), [state.q]);

  const setQuery = (q: string) => {
    setTyped(q);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => commit(withQuery(state, q)), searchDelay);
  };

  return {
    state,
    query: typed ?? state.q,
    setQuery,
    setFilter: (key: string, values: string[]) => commit(withFilter(state, key, values)),
    setSort: (sort: SortState) => commit(withSort(state, sort)),
    setPageSize: (size: number) => commit(withPageSize(state, size)),
    setPage: (page: number) => commit(withPage(state, page)),
    nextCursor: (cursor: string) => commit(withNextCursor(state, cursor)),
    previousCursor: () => commit(withPreviousCursor(state)),
    firstPage: () => commit(withFirstPage(state)),
    clear: () => { setTyped(""); commit(clearFilters(state)); },
    cursor: state.cursors[state.cursors.length - 1] ?? "",
    cursorPage: state.cursors.length + 1,
  };
}
