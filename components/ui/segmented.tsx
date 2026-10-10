"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { nextTab, type TabItem } from "./tabs";

const RADIO_KEYS: Record<string, string> = {
  ArrowRight: "ArrowRight", ArrowDown: "ArrowRight", ArrowLeft: "ArrowLeft", ArrowUp: "ArrowLeft", Home: "Home", End: "End",
};

export interface SegmentedProps<T extends string> {
  label: string;
  /** 2–5 choices. */
  items: readonly TabItem<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
}

// WAI-ARIA radio group: one tab stop, arrows move and select (wrapping), Home/End jump.
export function Segmented<T extends string>({ label, items, value, onChange, className }: SegmentedProps<T>) {
  const ids = items.map((item) => item.id);

  function onKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    const key = RADIO_KEYS[event.key];
    const next = key ? nextTab(ids, value, key) : null;
    if (next === null) return;
    event.preventDefault();
    onChange(next);
    event.currentTarget.querySelectorAll<HTMLElement>('[role="radio"]')[ids.indexOf(next)]?.focus();
  }

  return (
    <div role="radiogroup" aria-label={label} onKeyDown={onKeyDown} className={cn("inline-flex gap-1 rounded-lg border border-line bg-l1-2 p-1", className)}>
      {items.map((item) => {
        const checked = item.id === value;
        return (
          <button
            key={item.id}
            type="button"
            role="radio"
            aria-checked={checked}
            tabIndex={checked ? 0 : -1}
            onClick={() => onChange(item.id)}
            className={cn(
              "min-h-8 rounded-sm px-3 text-sm font-medium transition-colors duration-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] max-md:min-h-11",
              checked ? "bg-l1 text-fg shadow-sm" : "text-fg-3 hover:text-fg",
            )}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}
