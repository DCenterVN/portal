"use client";

import { useEffect, useState } from "react";

/** List shown by a client view: seeded by `initial`, otherwise loaded once on mount. A failed load is surfaced in `error`, never turned into an empty list. */
export function useLoadedList<T>(initial: T[] | undefined, load: () => Promise<T[]>) {
  const [items, setItems] = useState<T[]>(initial ?? []);
  const [loading, setLoading] = useState(!initial);
  const [error, setError] = useState("");
  useEffect(() => {
    if (initial) return;
    let live = true;
    load()
      .then((value) => { if (live) setItems(value); })
      .catch((e: unknown) => { if (live) setError(e instanceof Error ? e.message : "Không tải được danh sách"); })
      .finally(() => { if (live) setLoading(false); });
    return () => { live = false; };
  }, [initial, load]);
  return { items, setItems, loading, error };
}
