"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface TabItem<T extends string> {
  id: T;
  label: string;
}

// WAI-ARIA tabs keys: arrows wrap, Home/End jump; null = key is not a tab key.
export function nextTab<T>(ids: readonly T[], current: T, key: string): T | null {
  const index = ids.indexOf(current);
  if (key === "ArrowRight" || key === "ArrowDown") return ids[(index + 1) % ids.length];
  if (key === "ArrowLeft" || key === "ArrowUp") return ids[(index - 1 + ids.length) % ids.length];
  if (key === "Home") return ids[0];
  if (key === "End") return ids[ids.length - 1];
  return null;
}

export interface TabsProps<T extends string> {
  label: string;
  idPrefix: string;
  items: readonly TabItem<T>[];
  value: T;
  onChange: (value: T) => void;
  children: React.ReactNode;
}

export function Tabs<T extends string>({ label, idPrefix, items, value, onChange, children }: TabsProps<T>) {
  const buttons = React.useRef(new Map<T, HTMLButtonElement>());

  function onKeyDown(event: React.KeyboardEvent) {
    const next = nextTab(items.map((item) => item.id), value, event.key);
    if (next === null) return;
    event.preventDefault();
    onChange(next);
    buttons.current.get(next)?.focus();
  }

  return (
    <>
      <div role="tablist" aria-label={label} onKeyDown={onKeyDown} className="flex gap-1 border-b border-[var(--border)]">
        {items.map((item) => {
          const selected = item.id === value;
          return (
            <button
              key={item.id}
              ref={(element) => {
                if (element) buttons.current.set(item.id, element);
                else buttons.current.delete(item.id);
              }}
              id={`${idPrefix}-tab-${item.id}`}
              role="tab"
              type="button"
              aria-selected={selected}
              aria-controls={`${idPrefix}-panel`}
              tabIndex={selected ? 0 : -1}
              onClick={() => onChange(item.id)}
              className={cn(
                "flex min-h-11 items-center rounded-lg outline-none border-b-2 px-3 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]",
                selected ? "border-[var(--primary)] text-[var(--primary)]" : "border-transparent text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
              )}
            >
              {item.label}
            </button>
          );
        })}
      </div>
      <div role="tabpanel" id={`${idPrefix}-panel`} aria-labelledby={`${idPrefix}-tab-${value}`} tabIndex={0} className="focus-visible:outline-none">
        {children}
      </div>
    </>
  );
}
