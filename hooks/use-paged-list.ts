"use client";

import { useEffect, useReducer, useRef, useState } from "react";
import type { CursorPage } from "@/lib/api/all-pages";

type Paging = { scope: string; filter: string; cursors: string[]; next: string; revision: number };

/** Server-paged list: a new `scope` or `filter` restarts from the first page. Seeded by `initial`, otherwise the first page loads on mount. */
export function usePagedList<T>(load: (cursor: string, filter: string) => Promise<CursorPage<T>>, scope: string, initial?: T[], initialFilter = "") {
  const [items, setItems] = useState<T[]>(initial ?? []);
  const [loading, setLoading] = useState(!initial);
  const [error, setError] = useState("");
  const [paging, update] = useReducer((state: Paging, change: Partial<Paging>) => ({ ...state, ...change }), { scope, filter: initialFilter, cursors: [""], next: "", revision: 0 });
  if (paging.scope !== scope) update({ scope, cursors: [""], next: "" });
  const cursors = paging.scope === scope ? paging.cursors : [""];
  const cursor = cursors[cursors.length - 1];
  const loadRef = useRef(load);
  loadRef.current = load;
  const seeded = useRef(Boolean(initial));
  useEffect(() => {
    if (seeded.current) { seeded.current = false; return; }
    let active = true;
    setLoading(true); setError("");
    loadRef.current(cursor, paging.filter)
      .then(page => { if (active) { setItems(page.items); update({ next: page.next_cursor ?? "" }); } })
      .catch(cause => { if (active) setError(cause instanceof Error ? cause.message : "Không tải được dữ liệu. Thử lại sau."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [cursor, scope, paging.filter, paging.revision]);
  return {
    items, setItems, loading, error,
    filter: paging.filter,
    setFilter: (filter: string) => update({ filter, cursors: [""], next: "" }),
    reload: () => update({ cursors: [""], revision: paging.revision + 1 }),
    hasPrevious: cursors.length > 1,
    hasNext: Boolean(paging.next),
    next: () => update({ cursors: [...cursors, paging.next] }),
    previous: () => update({ cursors: cursors.slice(0, -1) }),
  };
}
