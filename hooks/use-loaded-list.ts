"use client";

import { useEffect, useRef, useState } from "react";

/** List shown by a client view: seeded by `initial`, otherwise loaded once on mount. A failed load is surfaced in `error`, never turned into an empty list. */
export function useLoadedList<T>(initial: T[] | undefined, load: () => Promise<T[]>) {
  const [items, setItems] = useState<T[]>(initial ?? []);
  const [loading, setLoading] = useState(!initial);
  const [error, setError] = useState("");
  const loadRef = useRef(load);
  const requestRef = useRef(0);
  const mountedRef = useRef(true);
  loadRef.current = load;
  const reloadRef = useRef<() => Promise<void>>(async () => {});
  reloadRef.current = async () => {
    const request = ++requestRef.current;
    setLoading(true);
    setError("");
    try {
      const value = await loadRef.current();
      if (mountedRef.current && request === requestRef.current) setItems(value);
    } catch {
      if (mountedRef.current && request === requestRef.current) setError("Không tải được dữ liệu. Thử lại sau.");
    } finally {
      if (mountedRef.current && request === requestRef.current) setLoading(false);
    }
  };
  useEffect(() => {
    mountedRef.current = true;
    if (initial) return;
    void reloadRef.current();
    return () => {
      mountedRef.current = false;
      requestRef.current++;
    };
  }, [initial]);
  return { items, setItems, loading, error, reload: reloadRef.current };
}
