"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { commitPageText, footerText, pageCount, pageText } from "./table-logic";
import type { DataTablePagination } from "./types";

const defaultSizes = [10, 20, 50, 100];

function canGo(pagination: DataTablePagination) {
  const { page, pageSize, total, hasNext, busy } = pagination;
  const next = pagination.kind === "cursor" ? hasNext : total === undefined ? Boolean(hasNext) : page < pageCount(total, pageSize);
  return { previous: !busy && page > 1, next: !busy && next };
}

function PageJump({ page, pages, busy, onPage }: { page: number; pages: number; busy?: boolean; onPage: (page: number) => void }) {
  const [text, setText] = React.useState(String(page));
  React.useEffect(() => setText(String(page)), [page]);
  const go = () => setText(commitPageText(text, page, pages, onPage));
  return <p className="flex items-center gap-2 font-medium whitespace-nowrap">
    Trang
    <Input inputMode="numeric" aria-label="Số trang" className="h-8 w-14 px-2 text-center" value={text} disabled={busy} onChange={event => setText(event.target.value)} onBlur={go} onKeyDown={event => { if (event.key === "Enter") go(); }} />
    trên {pages}
  </p>;
}

export function DataTableFooter({ pagination, label = "Phân trang" }: { pagination: DataTablePagination; label?: string }) {
  const { pageSize, pageSizes = defaultSizes, onPageSize } = pagination;
  const can = canGo(pagination);
  const sizeLabel = React.useId();
  const first = pagination.kind === "cursor" ? pagination.onFirst : () => pagination.onPage(1);
  const previous = pagination.kind === "cursor" ? pagination.onPrevious : () => pagination.onPage(pagination.page - 1);
  const next = pagination.kind === "cursor" ? pagination.onNext : () => pagination.onPage(pagination.page + 1);
  const last = pagination.kind === "page" && pagination.total !== undefined ? () => pagination.onPage(pageCount(pagination.total ?? 0, pageSize)) : undefined;
  return <nav aria-label={label} data-slot="data-table-footer" className="flex flex-col-reverse items-center justify-between gap-3 px-1 pt-3 text-sm sm:flex-row">
    <p role="status" aria-live="polite" className="text-muted-foreground">{footerText(pagination)}</p>
    <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
      <div className="flex items-center gap-2">
        <span id={sizeLabel} className="font-medium whitespace-nowrap">Số dòng mỗi trang</span>
        <Select value={String(pageSize)} onValueChange={value => onPageSize(Number(value))} disabled={pagination.busy}>
          <SelectTrigger aria-labelledby={sizeLabel} className="w-[4.5rem]"><SelectValue /></SelectTrigger>
          <SelectContent side="top">{pageSizes.map(size => <SelectItem key={size} value={String(size)}>{size}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      {pagination.kind === "page" && pagination.total !== undefined
        ? <PageJump page={pagination.page} pages={pageCount(pagination.total, pageSize)} busy={pagination.busy} onPage={pagination.onPage} />
        : <p className="font-medium whitespace-nowrap">{pageText(pagination)}</p>}
      <div className="flex items-center gap-2">
        <Button variant="outline" size="icon" aria-label="Về trang đầu" disabled={!can.previous} onClick={first}><ChevronsLeft aria-hidden="true" /></Button>
        <Button variant="outline" size="icon" aria-label="Trang trước" disabled={!can.previous} onClick={previous}><ChevronLeft aria-hidden="true" /></Button>
        <Button variant="outline" size="icon" aria-label="Trang sau" disabled={!can.next} onClick={next}><ChevronRight aria-hidden="true" /></Button>
        {last && <Button variant="outline" size="icon" aria-label="Tới trang cuối" disabled={!can.next} onClick={last}><ChevronsRight aria-hidden="true" /></Button>}
      </div>
    </div>
  </nav>;
}
