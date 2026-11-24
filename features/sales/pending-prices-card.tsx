"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusBadge } from "@/components/patterns/status-badge";
import { TablePager } from "@/components/patterns/table-pager";
import { EmptyState, ErrorState, LoadingState } from "@/components/patterns/empty-state";
import { formatVND } from "@/lib/format";
import { formatDate } from "@/lib/format-date";
import { proposerLabel, type PendingPriceRow } from "./price-approval";

type Pending = { items: PendingPriceRow[]; loading: boolean; error: string; reload: () => void; page: number; hasPrevious: boolean; hasNext: boolean; next: () => void; previous: () => void };

export function PendingPricesCard({ pending, busy, canApprove, approve }: { pending: Pending; busy: boolean; canApprove: boolean; approve: (row: PendingPriceRow) => void }) {
  return <Card className="mb-6"><CardHeader><CardTitle className="text-base">Chờ duyệt</CardTitle></CardHeader><CardContent>
    {pending.error ? <ErrorState title="Không tải được danh sách chờ duyệt" onRetry={pending.reload} /> : pending.loading ? <LoadingState title="Đang tải đề xuất giá…" /> : pending.items.length === 0 ? <EmptyState title="Không có đề xuất giá nào chờ duyệt" /> : <Table>
      <TableHeader><TableRow><TableHead>Món</TableHead><TableHead>Suất bán</TableHead><TableHead>Giá đề xuất</TableHead><TableHead>Giá sàn</TableHead><TableHead>Người đề xuất</TableHead><TableHead>Ngày đề xuất</TableHead><TableHead>Trạng thái</TableHead><TableHead /></TableRow></TableHeader>
      <TableBody>{pending.items.map(row => <TableRow key={row.id}>
        <TableCell>{row.product_name}</TableCell><TableCell>{row.variant_label || "Suất mặc định"}</TableCell>
        <TableCell className="tabular-nums">{formatVND(row.proposed_price_vnd)}</TableCell><TableCell className="tabular-nums">{formatVND(row.minimum_sale_price_vnd)}</TableCell>
        <TableCell>{proposerLabel(row)}</TableCell><TableCell>{formatDate(row.created_at)}</TableCell>
        <TableCell><StatusBadge tone="warning">Chờ duyệt</StatusBadge></TableCell>
        <TableCell>{canApprove && !row.authored_by_is_me && <Button size="sm" disabled={busy} onClick={() => approve(row)}>Duyệt</Button>}</TableCell>
      </TableRow>)}</TableBody>
    </Table>}
    <TablePager label="Phân trang giá chờ duyệt" busy={pending.loading || busy} status={`Trang ${pending.page}`} hasPrevious={pending.hasPrevious} onPrevious={pending.previous} hasNext={pending.hasNext} onNext={pending.next} />
  </CardContent></Card>;
}
