"use client";

import Link from "next/link";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Label } from "@/components/ui/label";
import { PageShell } from "@/components/ui/page";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EmptyState, ErrorState, LoadingState } from "@/components/patterns/empty-state";
import { PageHeading } from "@/components/patterns/page-heading";
import { useAccess } from "@/lib/access-boundary";
import { formatDateTime } from "@/lib/format-date";
import { TRANSFER_STATUS_LABEL, type TransferStatus } from "@/lib/stock-transfer";
import { TransferStatusBadge } from "./transfer-status-badge";
import { useBranchLabels } from "./use-transfer-lookups";
import { useTransferList, type TransferTab } from "./use-transfer-list";

export function StockTransfersView() {
  const { can, scope } = useAccess();
  const list = useTransferList();
  const names = useBranchLabels();
  const empty = list.status ? `Không có phiếu ${TRANSFER_STATUS_LABEL[list.status as TransferStatus].toLowerCase()} trong mục này.` : list.tab === "arrive" ? "Chưa có phiếu nào đang đến chi nhánh này." : "Chi nhánh này chưa gửi phiếu nào.";
  return (
    <PageShell>
      <PageHeading
        title="Chuyển hàng"
        description="Bếp trung tâm gửi nguyên liệu cho cửa hàng, cửa hàng kiểm và nhận lại."
        actions={can("inventory:transfer:create") && <Button asChild><Link href="/inventory/stock-transfers/new">Gửi hàng</Link></Button>}
      />
      <div className="mt-4 flex flex-wrap items-end justify-between gap-3">
        <Tabs value={list.tab} onValueChange={value => list.setTab(value as TransferTab)}>
          <TabsList aria-label="Hướng phiếu">
            <TabsTrigger value="arrive">Đang đến ({list.counts.arrive})</TabsTrigger>
            <TabsTrigger value="sent">Đã gửi ({list.counts.sent})</TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="flex flex-wrap items-end gap-3">
          {list.status && <Button type="button" variant="outline" size="sm" onClick={() => list.setStatus("")}>{TRANSFER_STATUS_LABEL[list.status as TransferStatus]}<X aria-hidden="true" /><span className="sr-only">Bỏ lọc trạng thái</span></Button>}
          <div className="grid w-44 gap-1.5">
            <Label htmlFor="transfer-status">Trạng thái</Label>
            <NativeSelect id="transfer-status" value={list.status} onChange={event => list.setStatus(event.target.value)}>
              <NativeSelectOption value="">Tất cả</NativeSelectOption>
              {Object.entries(TRANSFER_STATUS_LABEL).map(([value, label]) => <NativeSelectOption key={value} value={value}>{label}</NativeSelectOption>)}
            </NativeSelect>
          </div>
        </div>
      </div>
      <div className="mt-4">
        {list.error ? <ErrorState title="Không tải được danh sách phiếu." onRetry={list.retry} />
          : list.loading ? <LoadingState />
          : !list.rows.length ? <EmptyState title={empty} action={list.status ? <Button variant="outline" onClick={() => list.setStatus("")}>Xoá lọc</Button> : undefined} />
          : <Table aria-label="Phiếu chuyển hàng">
            <TableHeader><TableRow>{["Mã phiếu", "Nơi gửi → nơi nhận", "Số dòng", "Người gửi", "Giờ gửi", "Trạng thái"].map(label => <TableHead key={label}>{label}</TableHead>)}</TableRow></TableHeader>
            <TableBody>{list.rows.map(item => (
              <TableRow key={item.id}>
                <TableCell className="font-medium"><Link className="text-primary underline-offset-4 hover:underline" href={`/inventory/stock-transfers/${item.id}`}>{item.code}</Link></TableCell>
                <TableCell>{names.ends(item).from} → {names.ends(item).to}</TableCell>
                <TableCell className="tabular-nums">{item.lines.length}</TableCell>
                <TableCell>{item.sent_by_ref === scope?.userId ? "Bạn · " : ""}{names.ends(item).from}</TableCell>
                <TableCell className="tabular-nums">{formatDateTime(item.sent_at)}</TableCell>
                <TableCell><TransferStatusBadge status={item.status} /></TableCell>
              </TableRow>
            ))}</TableBody>
          </Table>}
      </div>
    </PageShell>
  );
}
