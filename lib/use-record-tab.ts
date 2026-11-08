"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useRef } from "react";
import type { Route } from "next";

export function useRecordTab(values: readonly string[]) {
  const pathname = usePathname();
  const search = useSearchParams();
  const router = useRouter();
  const requested = search.get("tab");
  const value = requested && values.includes(requested) ? requested : values[0];
  const target = useRef<{ element: HTMLDivElement | null; pending: string | null }>({ element: null, pending: null });
  const editTarget = useCallback((element: HTMLDivElement | null) => {
    target.current.element = element;
    if (!element || target.current.pending !== value) return;
    target.current.pending = null;
    focusField(element);
  }, [value]);
  function select(next: string) {
    if (!values.includes(next)) return;
    const query = new URLSearchParams(search.toString());
    query.set("tab", next);
    router.replace(`${pathname}?${query}` as Route, { scroll: false });
  }
  function edit(next: string) {
    if (!values.includes(next)) return;
    if (value === next) return focusField(target.current.element);
    target.current.pending = next;
    select(next);
  }
  return { value, select, edit, editTarget };
}

function focusField(target: HTMLElement | null) {
  target?.querySelector<HTMLElement>('input:not([disabled]):not([type="hidden"]), textarea:not([disabled]), select:not([disabled]), button[aria-pressed]:not([disabled]), button[role="combobox"]:not([disabled]), button[role="switch"]:not([disabled])')?.focus();
}
