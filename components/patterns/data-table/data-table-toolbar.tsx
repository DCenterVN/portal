"use client";

import * as React from "react";
import { Check, ListFilter, Search, SlidersHorizontal, X, XCircle } from "lucide-react";
import { fold } from "@/components/patterns/entity-picker";
import { Tip } from "@/components/patterns/tip";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { DateRangePicker } from "@/components/ui/date-picker";
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import type { DataTableColumn, FacetFilter, ToolbarConfig } from "./types";

type SelectedItem = { filter: FacetFilter; option: FacetFilter["options"][number] };

function collectSelected(filters: FacetFilter[]): SelectedItem[] {
  return filters.flatMap(filter =>
    filter.options
      .filter(option => filter.selected.includes(option.value))
      .map(option => ({ filter, option }))
  );
}

function toggleOption(filter: FacetFilter, value: string) {
  if (filter.single) {
    filter.onChange(filter.selected.includes(value) ? [] : [value]);
    return;
  }
  filter.onChange(
    filter.selected.includes(value)
      ? filter.selected.filter(item => item !== value)
      : [...filter.selected, value]
  );
}

function FilterMenu({ filters, selectedItems }: { filters: FacetFilter[]; selectedItems: SelectedItem[] }) {
  const [query, setQuery] = React.useState("");
  if (filters.length === 0) return null;
  const totalOptions = filters.reduce((sum, item) => sum + item.options.length, 0);
  const baseLabel = filters.length === 1 ? `Lọc theo ${filters[0].title}` : "Bộ lọc";
  const ariaLabel = selectedItems.length > 0 ? `${baseLabel} (${selectedItems.length} đang chọn)` : baseLabel;
  const tipLabel = filters.length === 1 ? `Lọc theo ${filters[0].title.toLowerCase()}` : "Bộ lọc";
  const needle = fold(query.trim());
  const groups = filters
    .map(filter => ({
      filter,
      options: needle ? filter.options.filter(option => fold(option.label).includes(needle)) : filter.options,
    }))
    .filter(group => group.options.length > 0);

  return (
    <Popover onOpenChange={() => setQuery("")}>
      <Tip label={tipLabel}>
        <PopoverTrigger asChild>
          <Button type="button" variant="outline" size="icon" data-slot="facet-filter" aria-label={ariaLabel} className="relative">
            <ListFilter aria-hidden="true" />
            {selectedItems.length > 0 && (
              <span aria-hidden="true" className="absolute -top-1.5 -right-1.5 flex size-4 items-center justify-center rounded-full bg-primary text-xs font-medium text-primary-foreground tabular-nums">
                {selectedItems.length}
              </span>
            )}
          </Button>
        </PopoverTrigger>
      </Tip>
      <PopoverContent align="start" className="w-60 p-0">
        <Command shouldFilter={false}>
          {totalOptions > 7 && <CommandInput value={query} onValueChange={setQuery} placeholder="Tìm bộ lọc…" />}
          <CommandList>
            <CommandEmpty>Không có kết quả.</CommandEmpty>
            {groups.map(({ filter, options }) => (
              <CommandGroup key={filter.id} heading={filter.title}>
                {options.map(option => {
                  const checked = filter.selected.includes(option.value);
                  return (
                    <CommandItem key={option.value} value={`${filter.id}:${option.value}`} onSelect={() => toggleOption(filter, option.value)} className="min-h-11 md:min-h-8">
                      {filter.single ? (
                        <Check aria-hidden="true" className={cn("size-4", !checked && "opacity-0")} />
                      ) : (
                        <Checkbox checked={checked} tabIndex={-1} aria-hidden="true" className="pointer-events-none" />
                      )}
                      <span className="truncate">{option.label}</span>
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            ))}
          </CommandList>
          {selectedItems.length > 0 && (
            <div className="border-t p-1">
              <Button type="button" variant="ghost" size="sm" className="w-full" onClick={() => filters.forEach(item => item.onChange([]))}>
                <XCircle aria-hidden="true" />
                Bỏ chọn
              </Button>
            </div>
          )}
        </Command>
      </PopoverContent>
    </Popover>
  );
}

function ColumnMenu<T>({ columns, hidden, onToggle }: { columns: DataTableColumn<T>[]; hidden: string[]; onToggle: (id: string) => void }) {
  const hideable = columns.filter(column => column.hideable);
  if (!hideable.length) return null;
  return (
    <DropdownMenu>
      <Tip label="Cột hiển thị">
        <DropdownMenuTrigger asChild>
          <Button type="button" variant="outline" size="icon" aria-label="Cột hiển thị">
            <SlidersHorizontal aria-hidden="true" />
          </Button>
        </DropdownMenuTrigger>
      </Tip>
      <DropdownMenuContent align="end" className="min-w-44">
        <DropdownMenuLabel>Cột hiển thị</DropdownMenuLabel>
        {hideable.map(column => (
          <DropdownMenuCheckboxItem key={column.id} checked={!hidden.includes(column.id)} onSelect={event => event.preventDefault()} onCheckedChange={() => onToggle(column.id)}>
            {column.header}
          </DropdownMenuCheckboxItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

type ToolbarProps<T> = ToolbarConfig & {
  columns: DataTableColumn<T>[];
  hidden: string[];
  onToggleColumn: (id: string) => void;
};

export function DataTableToolbar<T>({ search, filters = [], dateRange, active, onClear, primary, below, columns, hidden, onToggleColumn }: ToolbarProps<T>) {
  const selectedItems = collectSelected(filters);
  return (
    <div data-slot="data-table-toolbar" className="pb-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
          {search && (
            <div className="relative min-w-0 flex-1 sm:max-w-xs">
              <Search aria-hidden="true" className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input type="search" aria-label={search.label} placeholder={search.placeholder} value={search.value} onChange={event => search.onChange(event.target.value)} className="pl-8" />
            </div>
          )}
          <FilterMenu filters={filters} selectedItems={selectedItems} />
          {dateRange && <DateRangePicker from={dateRange.from} to={dateRange.to} onChange={dateRange.onChange} placeholder={dateRange.title} aria-label={dateRange.title} />}
          {active && onClear && (
            <Button type="button" variant="ghost" size="sm" onClick={onClear}>
              <X aria-hidden="true" />
              Xoá lọc
            </Button>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <ColumnMenu columns={columns} hidden={hidden} onToggle={onToggleColumn} />
          {primary}
        </div>
      </div>
      {active && selectedItems.length > 0 && (
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          {selectedItems.map(({ filter, option }) => (
            <Badge key={`${filter.id}:${option.value}`} variant="secondary" className="gap-1 rounded-sm pr-1 font-normal">
              <span>{filter.title}: {option.label}</span>
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                aria-label={`Bỏ lọc ${filter.title}: ${option.label}`}
                onClick={() => filter.onChange(filter.selected.filter(item => item !== option.value))}
              >
                <X aria-hidden="true" />
              </Button>
            </Badge>
          ))}
        </div>
      )}
      {below && <div className="mt-2">{below}</div>}
    </div>
  );
}
