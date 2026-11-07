"use client";

import * as React from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { InlineAlert } from "@/components/patterns/inline-alert";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Field } from "@/components/patterns/form-field";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

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
  searchPlaceholder?: string;
  className?: string;
}

// Accent and case blind: "da lat" finds "Đà Lạt". đ has no NFD decomposition, so it is mapped by hand.
export const fold = (text: string) => text.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase().replace(/đ/g, "d");

export const entityMatcher = <T,>(getLabel: (item: T) => string, getMeta?: (item: T) => string) =>
  (item: T, query: string) => fold(`${getLabel(item)} ${getMeta?.(item) ?? ""}`).includes(fold(query.trim()));

export function filterEntities<T>(items: T[], query: string, matches: (item: T, query: string) => boolean, max = Infinity) {
  return items.filter((item) => matches(item, query)).slice(0, max);
}

type ListProps<T> = Pick<EntityPickerProps<T>, "getId" | "getLabel" | "getMeta"> & {
  options: T[];
  picked: string | null;
  onPick: (id: string) => void;
  emptyMessage: string;
};

export function EntityList<T>({ options, picked, onPick, emptyMessage, getId, getLabel, getMeta }: ListProps<T>) {
  return (
    <CommandList>
      <CommandEmpty>{emptyMessage}</CommandEmpty>
      <CommandGroup>
        {options.map((item, index) => (
          <CommandItem key={getId(item)} value={String(index)} onSelect={() => onPick(getId(item))} className="min-h-11 md:min-h-8">
            <span className="grid min-w-0 flex-1">
              <span className="font-medium">{getLabel(item)}</span>
              {getMeta && <span className="text-xs text-muted-foreground">{getMeta(item)}</span>}
            </span>
            {getId(item) === picked && <Check aria-hidden="true" className="size-4 shrink-0 text-primary" />}
          </CommandItem>
        ))}
      </CommandGroup>
    </CommandList>
  );
}

// Popover + Command combobox. Only status "ready" offers options (fail closed on loading/error).
export function EntityPicker<T>({
  label, name, serializeValue = true, maxOptions = Infinity, items, status, getId, getLabel, getMeta, filter, value, onChange, required, error,
  emptyText = "Chưa có mục nào để chọn.", onRetry, placeholder, searchPlaceholder, className,
}: EntityPickerProps<T>) {
  const [own, setOwn] = React.useState<string | null>(null);
  const [query, setQuery] = React.useState("");
  const [open, setOpen] = React.useState(false);
  const [touched, setTouched] = React.useState(false);

  const id = `${name}-picker`;
  const picked = value !== undefined ? value : own;
  const list = status === "ready" ? items ?? [] : [];
  const matches = filter ?? entityMatcher(getLabel, getMeta);
  const options = open ? filterEntities(list, query, matches, maxOptions) : [];
  const selected = items?.find((item) => getId(item) === picked);
  const missing = required && !picked ? `Hãy chọn ${label.toLowerCase()} trong danh sách.` : undefined;

  const choose = (next: string | null) => {
    setOwn(next);
    setOpen(false);
    setQuery("");
    onChange?.(next);
  };

  const onOpenChange = (next: boolean) => {
    if (next && status !== "ready") return;
    setOpen(next);
    if (!next) {
      setQuery("");
      setTouched(true);
    }
  };

  return (
    <div className={cn("relative grid gap-1.5", className)}>
      <Popover open={open} onOpenChange={onOpenChange}>
        <Field label={label} htmlFor={id} error={error || (touched ? missing : undefined)}>
          <PopoverTrigger asChild>
            <Button
              id={id}
              type="button"
              variant="outline"
              role="combobox"
              aria-expanded={open}
              aria-required={required}
              aria-controls={open ? `${id}-listbox` : undefined}
              disabled={status !== "ready"}
              className="w-full justify-between border-input font-normal"
            >
              <span className={cn("truncate", !selected && "text-muted-foreground")}>{selected ? getLabel(selected) : placeholder ?? "Chọn…"}</span>
              <ChevronsUpDown aria-hidden="true" className="size-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
        </Field>
        <PopoverContent align="start" className="w-(--radix-popover-trigger-width) max-w-[calc(100vw-2rem)] p-0">
          <Command shouldFilter={false}>
            <CommandInput value={query} onValueChange={setQuery} placeholder={searchPlaceholder ?? placeholder ?? "Tìm…"} />
            <EntityList
              options={options}
              picked={picked ?? null}
              onPick={(next) => choose(!required && next === picked ? null : next)}
              emptyMessage={list.length ? `Không tìm thấy “${query}”.` : emptyText}
              getId={getId}
              getLabel={getLabel}
              getMeta={getMeta}
            />
          </Command>
        </PopoverContent>
      </Popover>
      <input
        name={serializeValue ? name : undefined}
        value={serializeValue ? picked ?? "" : picked ? "selected" : ""}
        tabIndex={-1}
        aria-hidden="true"
        ref={(element) => element?.setCustomValidity(missing ?? "")}
        onChange={() => {}}
        onInvalid={() => setTouched(true)}
        className="pointer-events-none absolute inset-x-0 bottom-0 h-px opacity-0"
      />
      {status === "loading" && (
        <p role="status" className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Spinner aria-hidden="true" className="size-3.5" />
          Đang tải…
        </p>
      )}
      {status === "error" && (
        <InlineAlert className="text-xs">
          Không tải được danh sách nên chưa chọn được.
          {onRetry && <Button type="button" variant="outline" size="sm" onClick={onRetry}>Thử lại</Button>}
        </InlineAlert>
      )}
      {status === "ready" && !items?.length && <p className="text-xs text-muted-foreground">{emptyText}</p>}
    </div>
  );
}
