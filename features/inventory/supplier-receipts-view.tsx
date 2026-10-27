"use client";

import { Button } from "@/components/ui/button";
import { Field, TextInput } from "@/components/ui/field";
import { Table, TableHeader, TableHead, TableBody, TableRow, TableCell } from "@/components/ui/table";
import { EmptyState, ErrorState, Skeleton } from "@/components/ui/state";
import type { SupplierHistory, SupplierReceipt } from "@/lib/api/supplier-history";
import type { ReactNode } from "react";

export type SupplierReceiptsViewProps = {
  read: boolean; page?: SupplierHistory; names: Record<string, string>; nameError: boolean;
  pending?: ReactNode; empty?: ReactNode; failure?: ReactNode;
  from: string; to: string; onFrom: (value: string) => void; onTo: (value: string) => void;
  hasPrevious: boolean; onPrevious: () => void; onNext: () => void; onRetry: () => void;
};
type ReceiptGroupProps = { receipt: SupplierReceipt; names: Record<string, string> };
const date = (value: string) => new Intl.DateTimeFormat("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" }).format(new Date(value));
const money = (value: number | null) => value === null ? "Chưa có dữ liệu" : value.toLocaleString("vi-VN");
const quantity = (value: string) => value.replace(".", ",");
const statuses: Record<string, string> = { DRAFT: "Nháp", IN_PROGRESS: "Đang nhận", COMPLETED: "Đã hoàn tất", CANCELLED: "Đã hủy" };

function ReceiptGroup({ receipt, names }: ReceiptGroupProps) {
  const draft = receipt.status === "DRAFT";
  return <article className="grid gap-3 rounded-lg border border-line p-4">
    <h3 className="font-semibold">{date(receipt.created_at)} · {statuses[receipt.status] ?? "Đang xử lý"}</h3>
    <p>{draft ? "Tổng dự kiến" : "Tổng thực nhận"}: {money(receipt.total_amount_vnd)} VND</p>
    <Table><TableHeader><TableRow><TableHead>Nguyên liệu</TableHead><TableHead>Số lượng dự kiến</TableHead>{!draft && <TableHead>Số lượng thực nhận</TableHead>}<TableHead>Đơn vị</TableHead><TableHead>Đơn giá VND</TableHead><TableHead>Thành tiền dự kiến</TableHead>{!draft && <TableHead>Thành tiền thực nhận</TableHead>}</TableRow></TableHeader>
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

export function SupplierReceiptsView({ read, page, names, nameError, pending, empty, failure, from, to, onFrom, onTo, hasPrevious, onPrevious, onNext, onRetry }: SupplierReceiptsViewProps) {
  if (!read) return <ErrorState denied title="Bạn không có quyền xem lịch sử nhập" />;
  return <section className="mt-6 grid gap-4" aria-label="Lịch sử nhập">
    <h2 className="text-xl font-semibold">Lịch sử nhập</h2>
    <div className="flex flex-wrap gap-3"><Field label="Từ ngày" htmlFor="supplier-history-from"><TextInput id="supplier-history-from" type="date" value={from} max={to || undefined} onChange={event => onFrom(event.target.value)} /></Field><Field label="Đến ngày" htmlFor="supplier-history-to"><TextInput id="supplier-history-to" type="date" value={to} min={from || undefined} onChange={event => onTo(event.target.value)} /></Field></div>
    {failure || (!page ? pending ?? <Skeleton title="Đang tải lịch sử nhập" /> : !page.items.length ? empty ?? <EmptyState title="Chưa có phiếu nhập cho nhà cung cấp này trong chi nhánh đang làm việc" /> : page.items.map(receipt => <ReceiptGroup key={receipt.id} receipt={receipt} names={names} />))}
    {nameError && <ErrorState title="Chưa tải được tên nguyên liệu" onRetry={onRetry} />}
    <div className="flex gap-3"><Button variant="outline" disabled={!page || !hasPrevious} onClick={onPrevious}>Trang trước</Button><Button variant="outline" disabled={!page?.next_cursor} onClick={onNext}>Trang sau</Button></div>
  </section>;
}
