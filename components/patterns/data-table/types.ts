import type { ReactNode } from "react";
import type { RowAction } from "@/components/patterns/row-actions";
import type { SortState } from "./table-logic";

export type DataTableColumn<T> = {
  id: string;
  header: string;
  cell: (row: T) => ReactNode;
  sortable?: boolean;
  sortValue?: (row: T) => string | number | null | undefined;
  hideable?: boolean;
  align?: "left" | "right";
  hideBelow?: "md" | "lg";
  className?: string;
};

type PaginationBase = {
  pageSize: number;
  pageSizes?: number[];
  page: number;
  count: number;
  total?: number;
  busy?: boolean;
  onPageSize: (size: number) => void;
};

export type CursorPagination = PaginationBase & {
  kind: "cursor";
  hasNext: boolean;
  onFirst: () => void;
  onPrevious: () => void;
  onNext: () => void;
};

export type PagePagination = PaginationBase & {
  kind: "page";
  hasNext?: boolean;
  onPage: (page: number) => void;
};

export type DataTablePagination = CursorPagination | PagePagination;

export type FacetFilter = {
  id: string;
  title: string;
  options: { value: string; label: string }[];
  selected: string[];
  onChange: (values: string[]) => void;
  single?: boolean;
};

export type DateRangeFilter = {
  title: string;
  from: string;
  to: string;
  onChange: (range: { from: string; to: string }) => void;
};

export type ToolbarConfig = {
  search?: { value: string; onChange: (value: string) => void; placeholder: string; label: string };
  filters?: FacetFilter[];
  dateRange?: DateRangeFilter;
  active?: boolean;
  onClear?: () => void;
  primary?: ReactNode;
  below?: ReactNode;
};

export type DataTableRowActions<T> = (row: T) => RowAction[];

export type DataTableSort = { sort: SortState; onSortChange: (sort: SortState) => void };
