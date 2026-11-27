"use client";

import { formatDate } from "@/lib/format-date";
import { formatVND } from "@/lib/format";
import Link from "next/link";
import { useAccess } from "@/lib/access-boundary";
import { buttonVariants } from "@/components/ui/button";
import { Field } from "@/components/patterns/form-field";
import { DatePicker } from "@/components/ui/date-picker";
import { Table, TableHeader, TableHead, TableBody, TableRow, TableCell } from "@/components/ui/table";
import { EmptyState, ErrorState, LoadingState } from "@/components/patterns/empty-state";
import { TablePager } from "@/components/patterns/table-pager";
import { StatusBadge, statusTone } from "@/components/patterns/status-badge";
import type { SupplierHistory, SupplierReceipt } from "@/lib/api/supplier-history";
import type { ReactNode } from "react";

export type SupplierReceiptsViewProps = {
  pageNumber?: number;
  read: boolean; page?: SupplierHistory; names: Record<string, string>; nameError: boolean;
  pending?: ReactNode; empty?: ReactNode; failure?: ReactNode;
  from: string; to: string; onFrom: (value: string) => void; onTo: (value: string) => void;
  hasPrevious: boolean; onPrevious: () => void; onNext: () => void; onRetry: () => void;
};
type ReceiptGroupProps = { receipt: SupplierReceipt; names: Record<string, string> };
const date = formatDate;
const money = (value: number | null) => value === null ? "Chưa có dữ liệu" : formatVND(value);
const quantity = (value: string) => value.replace(".", ",");
const statuses: Record<string, string> = { DRAFT: "Nháp", RECEIVING: "Đang nhận", IN_PROGRESS: "Đang nhận", COMPLETED: "Đã hoàn tất", CANCELLED: "Đã huỷ" };

function ReceiptGroup({ receipt, names }: ReceiptGroupProps) {
  const draft = receipt.status === "DRAFT";
  const { can } = useAccess();
  return <article className="grid gap-3 rounded-lg border border-border p-4">
    <div className="flex flex-wrap items-center gap-2"><h3 className="font-semibold">Phiếu nhập ngày {date(receipt.created_at)}</h3><StatusBadge tone={statusTone(receipt.status)}>{statuses[receipt.status] ?? "Đang xử lý"}</StatusBadge><span className="text-sm text-muted-foreground">{receipt.lines.length} dòng hàng</span>
      {["DRAFT", "IN_PROGRESS", "RECEIVING"].includes(receipt.status) && can("inventory:goods_receipt:update") && <Link className={buttonVariants({ variant: "outline", size: "sm", className: "ml-auto" })} href={{ pathname: `/inventory/goods-receipts/${encodeURIComponent(receipt.id)}/receive`, query: { supplier: receipt.supplier_ref } }}>Nhận hàng</Link>}</div>
    <p>{draft ? "Tổng dự kiến" : "Tổng thực nhận"}: {formatVND(draft ? receipt.total_amount_vnd : receipt.lines.reduce((sum, line) => sum + (line.actual_amount_vnd ?? 0), 0))}</p>
    <Table><TableHeader><TableRow><TableHead>Nguyên liệu</TableHead><TableHead>Số lượng dự kiến</TableHead>{!draft && <TableHead>Số lượng thực nhận</TableHead>}<TableHead>Đơn vị</TableHead><TableHead>Đơn giá</TableHead><TableHead>Thành tiền dự kiến</TableHead>{!draft && <TableHead>Thành tiền thực nhận</TableHead>}</TableRow></TableHeader>
      <TableBody>{receipt.lines.map(line => <TableRow key={line.receipt_line_ref}>
        <TableCell>{names[line.sku_ref] ?? "Nguyên liệu đã ngừng hoặc chưa tải được tên"}</TableCell>
        <TableCell className="text-right tabular-nums">{quantity(line.expected_quantity)}</TableCell>
        {!draft && <TableCell className="text-right tabular-nums">{quantity(line.actual_quantity)}</TableCell>}
        <TableCell>{line.uom}</TableCell><TableCell className="text-right tabular-nums">{money(line.unit_cost_vnd)}</TableCell>
        <TableCell className="text-right tabular-nums">{money(line.expected_amount_vnd)}</TableCell>
        {!draft && <TableCell className="text-right tabular-nums">{money(line.actual_amount_vnd)}</TableCell>}
      </TableRow>)}</TableBody></Table>
  </article>;
}

export function SupplierReceiptsView({ read, page, names, nameError, pending, empty, failure, from, to, onFrom, onTo, hasPrevious, onPrevious, onNext, onRetry, pageNumber = 1 }: SupplierReceiptsViewProps) {
  if (!read) return <ErrorState denied title="Bạn không có quyền xem lịch sử nhập" />;
  return <section className="mt-6 grid gap-4" aria-label="Lịch sử nhập">
    <h2 className="text-xl font-semibold">Lịch sử nhập</h2>
    <div className="flex flex-wrap gap-3 [&>*]:w-full sm:[&>*]:w-56"><Field label="Từ ngày" htmlFor="supplier-history-from"><DatePicker placeholder="ngày/tháng/năm" id="supplier-history-from" value={from} max={to || undefined} onChange={onFrom} /></Field><Field label="Đến ngày" htmlFor="supplier-history-to"><DatePicker placeholder="ngày/tháng/năm" id="supplier-history-to" value={to} min={from || undefined} onChange={onTo} /></Field></div>
    {failure || (!page ? pending ?? <LoadingState title="Đang tải lịch sử nhập" /> : !page.items.length ? empty ?? <EmptyState title="Chưa nhập lần nào từ nhà cung cấp này" description="Phiếu nhập từ nhà cung cấp này sẽ hiện ở đây." /> : page.items.map(receipt => <ReceiptGroup key={receipt.id} receipt={receipt} names={names} />))}
    {nameError && <ErrorState title="Chưa tải được tên nguyên liệu" onRetry={onRetry} />}
    {!(page && !page.items.length && !hasPrevious) && <TablePager status={`Trang ${pageNumber}`} busy={!page} hasPrevious={hasPrevious} onPrevious={onPrevious} hasNext={Boolean(page?.next_cursor)} onNext={onNext} />}
  </section>;
}
