"use client";

import * as React from "react";
import { Check, Loader2 } from "lucide-react";
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
  const expanded = options.length > 0;
  const current = Math.min(active, options.length - 1);
  const selected = items?.find((item) => getId(item) === picked);
  const missing = required && !picked ? `Hãy chọn ${label.toLowerCase()} trong danh sách.` : undefined;

  const choose = (next: string | null) => {
    setOwn(next);
    setQuery(null);
    setOpen(false);
    onChange?.(next);
  };

  function onKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Escape") return open ? setOpen(false) : setQuery(null);
    if (event.key === "Enter" && expanded) {
      event.preventDefault();
      return choose(getId(options[current]));
    }
    const key = LIST_KEYS[event.key];
    if (!key || (!open && key !== "ArrowRight" && key !== "ArrowLeft")) return;
    event.preventDefault();
    if (!open) return (setOpen(true), setActive(0));
    if (expanded) setActive(nextTab(options.map((_, index) => index), current, key) ?? current);
  }

  return (
    <div className={cn("relative grid gap-1.5", className)}>
      <Field label={label} htmlFor={id} error={error || (touched ? missing : undefined)}>
        <TextInput
          ref={(element) => element?.setCustomValidity(missing ?? "")}
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
          onChange={(event) => {
            const text = event.target.value;
            if (!text && picked) return choose(null);
            setQuery(text);
            setOpen(true);
            setActive(0);
          }}
          onKeyDown={onKeyDown}
          onBlur={() => {
            setTouched(true);
            setOpen(false);
            setQuery(null);
          }}
          onInvalid={() => setTouched(true)}
        />
      </Field>
      {serializeValue && <input type="hidden" name={name} value={picked ?? ""} />}
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
      {open && list.length > 0 && !expanded && <p role="status" className="text-xs text-fg-3">Không tìm thấy “{query}”.</p>}
      <ul
        id={`${id}-listbox`}
        role="listbox"
        aria-label={label}
        hidden={!expanded}
        className="absolute inset-x-0 top-full z-(--z-popover) mt-1 max-h-64 overflow-auto rounded-lg border border-glass-edge bg-glass-l3 p-1 text-fg shadow-l3 glass-blur-l3"
      >
        {options.map((item, index) => (
          <li
            key={getId(item)}
            id={`${id}-option-${index}`}
            role="option"
            aria-selected={index === current}
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => choose(getId(item))}
            className={cn("flex min-h-11 cursor-pointer items-center gap-2 rounded-sm px-3 text-sm hover:bg-l1-2 md:min-h-8", index === current && "bg-p-soft")}
          >
            <span className="min-w-0 flex-1 truncate">{getLabel(item)}</span>
            {getMeta && <span className="shrink-0 text-xs text-fg-3">{getMeta(item)}</span>}
            {getId(item) === picked && <Check aria-hidden="true" className="size-4 shrink-0 text-p" />}
          </li>
        ))}
      </ul>
    </div>
  );
}
