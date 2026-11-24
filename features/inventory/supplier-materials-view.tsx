"use client";

import Link from "next/link";
import type { Route } from "next";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/patterns/status-badge";
import { EmptyState, ErrorState, LoadingState } from "@/components/patterns/empty-state";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatVND } from "@/lib/format";
import { formatDate } from "@/lib/format-date";
import { uomLabel } from "@/lib/stock-transfer";
import type { PriceRow } from "./supplier-price-rows";

export type SupplierMaterialsViewProps = {
  state: "loading" | "error" | "ready"; rows: PriceRow[]; drafts: number; active: boolean; canUpdate: boolean; supplierId: string; profile?: boolean;
  onAdd: () => void; onEdit: () => void; onStatus: () => void; onRetry: () => void;
};

function Thumb({ row }: { row: PriceRow }) {
  if (row.image) return <img src={row.image} alt="" className="size-8 shrink-0 rounded-lg object-cover" />;
  return <div aria-hidden className="grid size-8 shrink-0 place-items-center rounded-lg bg-muted text-xs font-semibold text-muted-foreground">{row.name.slice(0, 1).toLocaleUpperCase("vi")}</div>;
}

export function SupplierMaterialsView({ state, rows, drafts, active, canUpdate, supplierId, profile, onAdd, onEdit, onStatus, onRetry }: SupplierMaterialsViewProps) {
  const add = canUpdate && active && !profile ? <Button size="sm" variant="outline" className="w-full sm:w-auto" onClick={onAdd}>Thêm giá nguyên liệu</Button> : undefined;
  const history = `/inventory/suppliers/${encodeURIComponent(supplierId)}` as Route;
  return <section aria-label="Nguyên liệu cung cấp" className="grid gap-3 py-2">
    <h3 className="text-sm font-semibold">Nguyên liệu cung cấp</h3>
    {state === "loading" ? <LoadingState title="Đang tải nguyên liệu và giá" />
    : state === "error" ? <ErrorState title="Không tải được nguyên liệu và giá" onRetry={onRetry} />
    : rows.length === 0 ? <EmptyState title="Chưa có nguyên liệu nào có giá. Thêm giá để có giá tham khảo khi nhập hàng." action={add} />
    : <><div className="hidden md:block"><Table><TableHeader><TableRow><TableHead>Nguyên liệu</TableHead><TableHead className="text-right">Giá</TableHead><TableHead className="text-right">Áp dụng đến ngày</TableHead></TableRow></TableHeader>
      <TableBody>{rows.map(row => <TableRow key={`${row.sku}-${row.uom}-${row.valid_to}`}>
        <TableCell><div className="flex min-w-0 items-center gap-2"><Thumb row={row} /><span className="min-w-0 break-words font-medium">{row.name}</span></div></TableCell>
        <TableCell className="whitespace-nowrap text-right">{formatVND(row.unit_price_vnd)} / {uomLabel(row.uom)}</TableCell>
        <TableCell className="text-right"><div className="flex flex-wrap items-center justify-end gap-2"><span className="whitespace-nowrap">{formatDate(row.valid_to)}</span>{row.expiring && <StatusBadge tone="warning">Sắp hết hạn</StatusBadge>}</div></TableCell>
      </TableRow>)}</TableBody></Table></div>
      <ul className="grid gap-2 md:hidden">{rows.map(row => <li key={`${row.sku}-${row.uom}-${row.valid_to}`} className="grid gap-1 rounded-lg border p-3">
        <div className="flex min-w-0 items-center gap-2"><Thumb row={row} /><span className="min-w-0 break-words font-medium">{row.name}</span></div>
        <span className="text-sm">{formatVND(row.unit_price_vnd)} / {uomLabel(row.uom)}</span>
        <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground"><span>Áp dụng đến ngày {formatDate(row.valid_to)}</span>{row.expiring && <StatusBadge tone="warning">Sắp hết hạn</StatusBadge>}</div>
      </li>)}</ul></>}
    {drafts > 0 && !profile && <p className="text-sm text-muted-foreground">Có {drafts} bảng giá nháp chưa áp dụng. <Link className="underline underline-offset-4" href={history}>Xem bảng giá nháp</Link></p>}
    {!profile && <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end">
      {rows.length > 0 && add}
      {canUpdate && <Button size="sm" variant="outline" className="w-full sm:w-auto" onClick={onEdit}>Sửa thông tin</Button>}
      {canUpdate && <Button size="sm" variant="outline" className="w-full sm:w-auto" onClick={onStatus}>{active ? "Ngừng hợp tác" : "Hợp tác lại"}</Button>}
      <Button asChild size="sm" variant="outline" className="w-full sm:w-auto"><Link href={history}>Lịch sử giá và nhập hàng</Link></Button>
    </div>}
  </section>;
}
