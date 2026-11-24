"use client";

import * as React from "react";
import { ArrowDown, ArrowUp, ChevronRight, ChevronsUpDown } from "lucide-react";
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EmptyState, ErrorState } from "@/components/patterns/empty-state";
import { RowActions } from "@/components/patterns/row-actions";
import { cn } from "@/lib/utils";
import { DataTableFooter } from "./data-table-footer";
import { DataTableToolbar } from "./data-table-toolbar";
import { pageCount, sliceRows, sortRows, toggleHidden, visibleColumns, type SortState } from "./table-logic";
import type { DataTableColumn, DataTablePagination, DataTableRowActions, ToolbarConfig } from "./types";

const hideClass = { md: "hidden md:table-cell", lg: "hidden lg:table-cell" } as const;
const clientSizes = [10, 20, 50, 100];

function readHidden(key: string): string[] {
  try {
    const saved: unknown = JSON.parse(localStorage.getItem(key) ?? "[]");
    return Array.isArray(saved) ? saved.filter(item => typeof item === "string") : [];
  } catch {
    return [];
  }
}

function writeHidden(key: string, hidden: string[]) {
  try {
    localStorage.setItem(key, JSON.stringify(hidden));
  } catch {
    return;
  }
}

function useHiddenColumns(storageKey?: string) {
  const [hidden, setHidden] = React.useState<string[]>([]);
  const key = storageKey && `data-table:${storageKey}:hidden`;
  React.useEffect(() => {
    if (key) setHidden(readHidden(key));
  }, [key]);
  const toggle = (id: string) => setHidden(current => {
    const next = toggleHidden(current, id);
    if (key) writeHidden(key, next);
    return next;
  });
  return { hidden, toggle };
}

function useClientView<T>(rows: T[], columns: DataTableColumn<T>[], enabled: boolean, defaultSort: SortState) {
  const [sort, setSort] = React.useState<SortState>(defaultSort);
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(clientSizes[0]);
  if (!enabled) return { shown: rows, sort, setSort, pagination: undefined };
  const column = sort ? columns.find(item => item.id === sort.id) : undefined;
  const sorted = column?.sortValue ? sortRows(rows, column.sortValue, sort?.desc ?? false) : rows;
  const current = Math.min(page, pageCount(sorted.length, pageSize));
  const shown = sliceRows(sorted, current, pageSize);
  const pagination: DataTablePagination | undefined = rows.length > clientSizes[0]
    ? { kind: "page", page: current, pageSize, total: rows.length, count: shown.length, onPage: setPage, onPageSize: size => { setPageSize(size); setPage(1); } }
    : undefined;
  return { shown, sort, setSort: (next: SortState) => { setSort(next); setPage(1); }, pagination };
}

function SortHeader<T>({ column, sort, onSort }: { column: DataTableColumn<T>; sort: SortState; onSort: (sort: SortState) => void }) {
  const active = sort?.id === column.id ? sort : null;
  const Icon = !active ? ChevronsUpDown : active.desc ? ArrowDown : ArrowUp;
  return <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <button type="button" className={cn("-mx-2 inline-flex h-8 items-center gap-1.5 rounded-lg px-2 font-medium hover:bg-accent focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none", column.align === "right" && "flex-row-reverse")}>
        {column.header}<Icon aria-hidden="true" className={cn("size-3.5", !active && "opacity-50")} />
      </button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="start" className="min-w-36">
      <DropdownMenuCheckboxItem checked={Boolean(active && !active.desc)} onCheckedChange={() => onSort({ id: column.id, desc: false })}>Tăng dần</DropdownMenuCheckboxItem>
      <DropdownMenuCheckboxItem checked={Boolean(active?.desc)} onCheckedChange={() => onSort({ id: column.id, desc: true })}>Giảm dần</DropdownMenuCheckboxItem>
      {active && <DropdownMenuCheckboxItem checked={false} onCheckedChange={() => onSort(null)}>Bỏ sắp xếp</DropdownMenuCheckboxItem>}
    </DropdownMenuContent>
  </DropdownMenu>;
}

const interactive = "a,button,input,select,textarea,[role=button]";
export const rowOpenProps = (open: () => void) => ({
  tabIndex: 0,
  onClick: (event: React.MouseEvent) => { if (!(event.target as HTMLElement).closest?.(interactive)) open(); },
  onKeyDown: (event: React.KeyboardEvent) => { if (event.key === "Enter" && event.target === event.currentTarget) open(); },
});

export type DataTableProps<T> = {
  columns: DataTableColumn<T>[];
  rows?: T[];
  initialData?: T[];
  rowId: (row: T) => string;
  rowLabel: (row: T) => string;
  mode: "client" | "server";
  status?: "loading" | "ready" | "error";
  error?: string;
  onRetry?: () => void;
  empty: { title: string; description?: string; action?: React.ReactNode };
  defaultSort?: SortState;
  sort?: SortState;
  onSortChange?: (sort: SortState) => void;
  pagination?: DataTablePagination;
  paginationLabel?: string;
  toolbar?: ToolbarConfig;
  storageKey?: string;
  rowActions?: DataTableRowActions<T>;
  onRowOpen?: (row: T) => void;
  renderExpanded?: (row: T) => React.ReactNode;
  expandedIds?: string[];
  onToggleRow?: (id: string) => void;
  className?: string;
};

export function DataTable<T>({ columns, rows, initialData, rowId, rowLabel, mode, status = "ready", error, onRetry, empty, defaultSort = null, sort, onSortChange, pagination, paginationLabel, toolbar, storageKey, rowActions, onRowOpen, renderExpanded, expandedIds = [], onToggleRow, className }: DataTableProps<T>) {
  const { hidden, toggle } = useHiddenColumns(storageKey);
  const source = rows ?? initialData;
  const client = useClientView(source ?? [], columns, mode === "client", defaultSort);
  const activeSort = mode === "client" ? client.sort : sort ?? null;
  const onSort = mode === "client" ? client.setSort : onSortChange ?? (() => {});
  const shown = mode === "client" ? client.shown : source ?? [];
  const footer = mode === "client" ? client.pagination : pagination;
  const columnsView = visibleColumns(columns, hidden);
  const expandable = Boolean(renderExpanded);
  const span = columnsView.length + (expandable ? 1 : 0) + (rowActions ? 1 : 0);
  const loading = status === "loading" && !source;
  return <div data-slot="data-table" className={cn("w-full", className)}>
    {toolbar && <DataTableToolbar {...toolbar} columns={columns} hidden={hidden} onToggleColumn={toggle} />}
    <div className="overflow-hidden rounded-lg border bg-card">
      <Table>
        <TableHeader className="bg-muted/40">
          <TableRow className="hover:bg-transparent">
            {expandable && <TableHead className="w-10"><span className="sr-only">Mở rộng</span></TableHead>}
            {columnsView.map(column => <TableHead key={column.id} aria-sort={activeSort?.id === column.id ? (activeSort.desc ? "descending" : "ascending") : undefined} className={cn("h-11 font-medium", column.align === "right" && "text-right", column.hideBelow && hideClass[column.hideBelow])}>
              {column.sortable ? <SortHeader column={column} sort={activeSort} onSort={onSort} /> : column.header}
            </TableHead>)}
            {rowActions && <TableHead className="w-12"><span className="sr-only">Thao tác</span></TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? Array.from({ length: 5 }, (_, index) => <TableRow key={index} aria-hidden="true" className="h-11">
            <TableCell colSpan={span}><Skeleton className="h-4 w-full max-w-md" /></TableCell>
          </TableRow>)
          : status === "error" && !source ? <TableRow className="hover:bg-transparent"><TableCell colSpan={span}><ErrorState className="border-0" title={error ?? "Chưa tải được dữ liệu."} onRetry={onRetry} /></TableCell></TableRow>
          : !shown.length ? <TableRow className="hover:bg-transparent"><TableCell colSpan={span}><EmptyState className="border-0" {...empty} /></TableCell></TableRow>
          : shown.map(row => {
            const id = rowId(row);
            const open = expandedIds.includes(id);
            return <React.Fragment key={id}>
              <TableRow data-state={open ? "selected" : undefined} className={cn("h-11", onRowOpen && "cursor-pointer focus-visible:bg-muted/50 focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none focus-visible:ring-inset")}
                {...(onRowOpen ? rowOpenProps(() => onRowOpen(row)) : {})}>
                {expandable && <TableCell className="w-10 pr-0">
                  <button type="button" aria-expanded={open} aria-label={`${open ? "Thu gọn" : "Mở rộng"} ${rowLabel(row)}`} onClick={() => onToggleRow?.(id)} className="inline-flex size-8 items-center justify-center rounded-lg hover:bg-accent focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none">
                    <ChevronRight aria-hidden="true" className={cn("size-4 transition-transform", open && "rotate-90")} />
                  </button>
                </TableCell>}
                {columnsView.map(column => <TableCell key={column.id} className={cn(column.align === "right" && "text-right tabular-nums", column.hideBelow && hideClass[column.hideBelow], column.className)}>{column.cell(row)}</TableCell>)}
                {rowActions && <TableCell className="w-12 text-right"><RowActions label={rowLabel(row)} actions={rowActions(row)} /></TableCell>}
              </TableRow>
              {open && renderExpanded && <TableRow className="bg-muted/20 hover:bg-muted/20"><TableCell colSpan={span} className="p-0 whitespace-normal">{renderExpanded(row)}</TableCell></TableRow>}
            </React.Fragment>;
          })}
        </TableBody>
      </Table>
    </div>
    {footer && <DataTableFooter pagination={footer} label={paginationLabel} />}
  </div>;
}
