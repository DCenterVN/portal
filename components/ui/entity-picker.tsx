"use client";

import * as React from "react";
import { Check, ChevronDown, Loader2 } from "./icons";
import { cn } from "@/lib/utils";
import { Button } from "./button";
import { Field, TextInput } from "./field";
import { nextTab } from "./tabs";

export interface EntityPickerProps<T> {
  label: string;
  /** Form field that carries the picked id; it rides in a hidden input, never on screen. */
  name: string;
  /** Keep controlled selections in state when IDs must stay out of the DOM. */
  serializeValue?: boolean;
  maxOptions?: number;
  items: T[] | undefined;
  status: "loading" | "ready" | "error";
  getId: (item: T) => string;
  getLabel: (item: T) => string;
  /** Secondary text the user knows (code, SKU); the default filter searches it too. */
  getMeta?: (item: T) => string;
  filter?: (item: T, query: string) => boolean;
  value?: string | null;
  onChange?: (id: string | null) => void;
  required?: boolean;
  error?: string;
  emptyText?: string;
  onRetry?: () => void;
  placeholder?: string;
  className?: string;
}

// Accent and case blind: "da lat" finds "Đà Lạt". đ has no NFD decomposition, so it is mapped by hand.
export const fold = (text: string) => text.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase().replace(/đ/g, "d");

const LIST_KEYS: Record<string, string> = { ArrowDown: "ArrowRight", ArrowUp: "ArrowLeft", Home: "Home", End: "End" };

// ARIA 1.2 combobox with list autocomplete. Only status "ready" offers options (fail closed on loading/error).
export function EntityPicker<T>({
  label, name, serializeValue = true, maxOptions = Infinity, items, status, getId, getLabel, getMeta, filter, value, onChange, required, error,
  emptyText = "Chưa có mục nào để chọn.", onRetry, placeholder, className,
}: EntityPickerProps<T>) {
  const [own, setOwn] = React.useState<string | null>(null);
  const [query, setQuery] = React.useState<string | null>(null);
  const [open, setOpen] = React.useState(false);
  const [active, setActive] = React.useState(0);
  const [touched, setTouched] = React.useState(false);

  const id = `${name}-picker`;
  const picked = value !== undefined ? value : own;
  const list = status === "ready" ? items ?? [] : [];
  const matches = filter ?? ((item: T, q: string) => fold(`${getLabel(item)} ${getMeta?.(item) ?? ""}`).includes(fold(q.trim())));
  const options = open ? list.filter((item) => matches(item, query ?? "")).slice(0, maxOptions) : [];
  const expanded = open && status === "ready";
  const current = Math.min(active, options.length - 1);
  const validPick = query === null ? picked : null;
  const selected = items?.find((item) => getId(item) === validPick);
  const missing = required && !validPick ? `Hãy chọn ${label.toLowerCase()} trong danh sách.` : undefined;

  const choose = (next: string | null) => {
    setOwn(next);
    setQuery(null);
    setOpen(false);
    onChange?.(next);
  };

  function onKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Escape") {
      event.preventDefault();
      event.stopPropagation?.();
      setOpen(false);
      if (query === null) setQuery(null);
      return;
    }
    if (event.key === "Tab") return setOpen(false);
    if (event.key === "Enter") {
      event.preventDefault();
      if (expanded && options[current]) choose(getId(options[current]));
      return;
    }
    const key = LIST_KEYS[event.key];
    if (!key || (!open && key !== "ArrowRight" && key !== "ArrowLeft")) return;
    event.preventDefault();
    if (!open) return (setOpen(true), setActive(0));
    if (expanded) setActive(nextTab(options.map((_, index) => index), current, key) ?? current);
  }

  return (
    <div className={cn("relative grid gap-1.5 [anchor-scope:--entity-picker]", className)}>
      <Field label={label} htmlFor={id} error={error || (touched ? missing : undefined)}>
        <TextInput
          ref={(element) => element?.setCustomValidity(missing ?? "")}
          className="pr-10 [anchor-name:--entity-picker]"
          id={id}
          role="combobox"
          autoComplete="off"
          aria-autocomplete="list"
          aria-required={required}
          aria-expanded={expanded}
          aria-controls={`${id}-listbox`}
          aria-activedescendant={expanded ? `${id}-option-${current}` : undefined}
          placeholder={placeholder}
          value={query ?? (selected ? getLabel(selected) : "")}
          onFocus={() => { if (status === "ready") setOpen(true); }}
          onClick={() => { if (status === "ready") setOpen(true); }}
          onChange={(event) => {
            const text = event.target.value;
            if (picked && query === null) {
              setOwn(null);
              onChange?.(null);
            }
            setQuery(text);
            setOpen(true);
            setActive(0);
          }}
          onKeyDown={onKeyDown}
          onBlur={() => {
            setTouched(true);
            setOpen(false);
          }}
          onInvalid={() => setTouched(true)}
        />
      </Field>
      <button
        type="button"
        aria-label={label}
        aria-haspopup="listbox"
        aria-expanded={expanded}
        aria-controls={`${id}-listbox`}
        disabled={status !== "ready"}
        title={label}
        className="absolute right-2 top-9 rounded-sm text-fg-3"
        onMouseDown={(event) => event.preventDefault()}
        onClick={(event) => {
          const next = !expanded;
          event.currentTarget?.parentElement?.querySelector<HTMLInputElement>("input[role=combobox]")?.focus();
          setOpen(next);
        }}
      >
        <ChevronDown aria-hidden="true" className="size-4" />
      </button>
      {serializeValue && <input type="hidden" name={name} value={validPick ?? ""} />}
      {status === "loading" && (
        <p role="status" className="flex items-center gap-1.5 text-xs text-fg-3">
          <Loader2 aria-hidden="true" className="size-3.5 animate-spin" />
          Đang tải…
        </p>
      )}
      {status === "error" && (
        <div role="alert" className="flex flex-wrap items-center gap-2 text-xs text-err">
          Không tải được danh sách nên chưa chọn được.
          {onRetry && <Button type="button" variant="outline" size="sm" onClick={onRetry}>Thử lại</Button>}
        </div>
      )}
      {status === "ready" && !items?.length && <p className="text-xs text-fg-3">{emptyText}</p>}

      <ul
        ref={(element) => {
          if (!element?.showPopover) return;
          if (expanded) element.showPopover();
          else element.hidePopover();
        }}
        popover="manual"
        id={`${id}-listbox`}
        role="listbox"
        aria-label={label}
        hidden={!expanded}
        className={cn(
          "m-0 max-h-64 overflow-auto rounded-lg border p-1",
          "bg-glass-l3 text-fg shadow-l3 glass-blur-l3",
          "[position-anchor:--entity-picker] top-[anchor(bottom)] left-[anchor(left)] w-[anchor-size(width)]",
          "[position-try-fallbacks:flip-block] max-w-[calc(100vw-2rem)]",
        )}
      >
        {expanded && !options.length && (
          <li role="status" className="p-2 text-xs text-fg-3">
            {list.length ? `Không tìm thấy “${query ?? ""}”.` : emptyText}
          </li>
        )}
        {options.map((item, index) => (
          <li
            key={getId(item)}
            id={`${id}-option-${index}`}
            role="option"
            aria-selected={index === current}
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => choose(getId(item))}
            className={cn(
              "flex min-h-11 cursor-pointer items-center gap-2 rounded-sm px-3",
              "text-sm hover:bg-l1-2 md:min-h-8",
              index === current && "bg-p-soft",
            )}
          >
            <span className="grid min-w-0 flex-1">
              <span className="truncate font-medium">{getLabel(item)}</span>
              {getMeta && <span className="truncate text-xs text-fg-3">{getMeta(item)}</span>}
            </span>
            {getId(item) === picked && <Check aria-hidden="true" className="size-4 shrink-0 text-p" />}
          </li>
        ))}
      </ul>
    </div>
  );
}
