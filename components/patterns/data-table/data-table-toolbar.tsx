"use client";

import * as React from "react";
import { ArrowDownAZ, ArrowUpAZ, Check, ChevronsUpDown, PlusCircle, Search, SlidersHorizontal, X, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { DateRangePicker } from "@/components/ui/date-picker";
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { fold } from "@/components/patterns/entity-picker";
import { cn } from "@/lib/utils";
import type { SortState } from "./table-logic";
import type { DataTableColumn, FacetFilter, ToolbarConfig } from "./types";

function selectedLabel(filter: FacetFilter) {
  const picked = filter.options.filter(option => filter.selected.includes(option.value));
  return picked.length > 2 ? [`${picked.length} đã chọn`] : picked.map(option => option.label);
}

export function FacetFilterButton({ filter }: { filter: FacetFilter }) {
  const [query, setQuery] = React.useState("");
  const labels = selectedLabel(filter);
  const options = filter.options.filter(option => fold(option.label).includes(fold(query.trim())));
  const toggle = (value: string) => {
    if (filter.single) return filter.onChange(filter.selected.includes(value) ? [] : [value]);
    filter.onChange(filter.selected.includes(value) ? filter.selected.filter(item => item !== value) : [...filter.selected, value]);
  };
  return <Popover onOpenChange={() => setQuery("")}>
    <PopoverTrigger asChild>
      <Button variant="outline" data-slot="facet-filter" className="border-dashed">
        <PlusCircle aria-hidden="true" />
        {filter.title}
        {labels.length > 0 && <>
          <Separator orientation="vertical" className="mx-0.5 h-4" />
          {labels.map(label => <Badge key={label} variant="secondary" className="rounded-sm font-normal">{label}</Badge>)}
        </>}
      </Button>
    </PopoverTrigger>
    <PopoverContent align="start" className="w-56 p-0">
      <Command shouldFilter={false}>
        <CommandInput value={query} onValueChange={setQuery} placeholder={filter.title} />
        <CommandList>
          <CommandEmpty>Không có kết quả.</CommandEmpty>
          <CommandGroup>
            {options.map(option => {
              const checked = filter.selected.includes(option.value);
              return <CommandItem key={option.value} value={option.value} onSelect={() => toggle(option.value)} className="min-h-11 md:min-h-8">
                {filter.single ? <Check aria-hidden="true" className={cn("size-4", !checked && "opacity-0")} /> : <Checkbox checked={checked} tabIndex={-1} aria-hidden="true" className="pointer-events-none" />}
                <span className="truncate">{option.label}</span>
              </CommandItem>;
            })}
          </CommandGroup>
        </CommandList>
        {filter.selected.length > 0 && <div className="border-t p-1"><Button variant="ghost" size="sm" className="w-full" onClick={() => filter.onChange([])}><XCircle aria-hidden="true" />Bỏ chọn</Button></div>}
      </Command>
    </PopoverContent>
  </Popover>;
}

function SortMenu<T>({ columns, sort, onSort }: { columns: DataTableColumn<T>[]; sort: SortState; onSort: (sort: SortState) => void }) {
  const sortable = columns.filter(column => column.sortable);
  if (!sortable.length) return null;
  return <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <Button variant="outline">{sort?.desc ? <ArrowUpAZ aria-hidden="true" /> : <ArrowDownAZ aria-hidden="true" />}Sắp xếp</Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end" className="min-w-48">
      <DropdownMenuLabel>Sắp xếp theo</DropdownMenuLabel>
      {sortable.map(column => <React.Fragment key={column.id}>
        <DropdownMenuCheckboxItem checked={sort?.id === column.id && !sort.desc} onCheckedChange={() => onSort({ id: column.id, desc: false })}>{column.header}, tăng dần</DropdownMenuCheckboxItem>
        <DropdownMenuCheckboxItem checked={sort?.id === column.id && sort.desc} onCheckedChange={() => onSort({ id: column.id, desc: true })}>{column.header}, giảm dần</DropdownMenuCheckboxItem>
      </React.Fragment>)}
      {sort && <><DropdownMenuSeparator /><DropdownMenuCheckboxItem checked={false} onCheckedChange={() => onSort(null)}>Bỏ sắp xếp</DropdownMenuCheckboxItem></>}
    </DropdownMenuContent>
  </DropdownMenu>;
}

function ColumnMenu<T>({ columns, hidden, onToggle }: { columns: DataTableColumn<T>[]; hidden: string[]; onToggle: (id: string) => void }) {
  const hideable = columns.filter(column => column.hideable);
  if (!hideable.length) return null;
  return <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <Button variant="outline"><SlidersHorizontal aria-hidden="true" />Hiển thị<ChevronsUpDown aria-hidden="true" className="opacity-50" /></Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end" className="min-w-44">
      <DropdownMenuLabel>Cột hiển thị</DropdownMenuLabel>
      {hideable.map(column => <DropdownMenuCheckboxItem key={column.id} checked={!hidden.includes(column.id)} onSelect={event => event.preventDefault()} onCheckedChange={() => onToggle(column.id)}>{column.header}</DropdownMenuCheckboxItem>)}
    </DropdownMenuContent>
  </DropdownMenu>;
}

type ToolbarProps<T> = ToolbarConfig & {
  columns: DataTableColumn<T>[];
  sort: SortState;
  onSort: (sort: SortState) => void;
  hidden: string[];
  onToggleColumn: (id: string) => void;
};

export function DataTableToolbar<T>({ search, filters = [], dateRange, active, onClear, primary, below, columns, sort, onSort, hidden, onToggleColumn }: ToolbarProps<T>) {
  return <div data-slot="data-table-toolbar" className="pb-3">
    <div className="flex flex-wrap items-center justify-between gap-2">
    <div className="flex min-w-full flex-1 flex-wrap items-center gap-2 sm:min-w-0">
      {search && <div className="relative w-full sm:w-64">
        <Search aria-hidden="true" className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input type="search" aria-label={search.label} placeholder={search.placeholder} value={search.value} onChange={event => search.onChange(event.target.value)} className="pl-8" />
      </div>}
      {filters.map(filter => <FacetFilterButton key={filter.id} filter={filter} />)}
      {dateRange && <DateRangePicker from={dateRange.from} to={dateRange.to} onChange={dateRange.onChange} placeholder={dateRange.title} aria-label={dateRange.title} />}
      {active && onClear && <Button variant="ghost" onClick={onClear}><X aria-hidden="true" />Xoá lọc</Button>}
      <SortMenu columns={columns} sort={sort} onSort={onSort} />
    </div>
    <div className="flex flex-wrap items-center gap-2">
      <ColumnMenu columns={columns} hidden={hidden} onToggle={onToggleColumn} />
      {primary}
    </div>
    </div>
    {below && <div className="mt-2">{below}</div>}
  </div>;
}
