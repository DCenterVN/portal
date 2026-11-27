"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { useAccess } from "@/lib/access-boundary";
import { listGoodsReceipts, type GoodsReceiptListPage } from "@/lib/api/goods-receipts";
import { formatDate } from "@/lib/format-date";
import { formatVND } from "@/lib/format";
import { Button, buttonVariants } from "@/components/ui/button";
import { PageShell } from "@/components/ui/page";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EmptyState, ErrorState, LoadingState } from "@/components/patterns/empty-state";
import { PageHeading } from "@/components/patterns/page-heading";
import { StatusBadge, statusTone } from "@/components/patterns/status-badge";
import { TablePager } from "@/components/patterns/table-pager";
import { InventoryFlowBar } from "./inventory-flow-bar";

type StatusTab = "" | "RECEIVING" | "DRAFT" | "COMPLETED";

const STATUS_TABS: { value: StatusTab; label: string }[] = [
  { value: "", label: "Tất cả" },
  { value: "RECEIVING", label: "Đang nhận" },
  { value: "DRAFT", label: "Nháp" },
  { value: "COMPLETED", label: "Đã hoàn tất" },
];

const RECEIPT_STATUS_LABELS: Record<string, string> = {
  DRAFT: "Nháp",
  RECEIVING: "Đang nhận",
  IN_PROGRESS: "Đang nhận",
  COMPLETED: "Đã hoàn tất",
  CANCELLED: "Đã hủy",
};

const formatQty = (value: string) => value.replace(".", ",");

export function GoodsReceiptsListView() {
  const { can, scope } = useAccess();
  const canRead = can("inventory:lot:read");
  const canCreate = can("inventory:goods_receipt:create");
  const canReceive = can("inventory:goods_receipt:update");
  const branchRef = scope?.branchId ?? "";

  const [status, setStatus] = useState<StatusTab>("");
  const [cursors, setCursors] = useState<string[]>([""]);
  const [cursorBranch, setCursorBranch] = useState(branchRef);
  const [page, setPage] = useState<GoodsReceiptListPage | null>(null);
  const [error, setError] = useState("");
  const [revision, setRevision] = useState(0);

  if (cursorBranch !== branchRef) {
    setCursorBranch(branchRef);
    setCursors([""]);
  }

  const currentCursor = cursors[cursors.length - 1] ?? "";

  useEffect(() => {
    if (!canRead) return;
    let active = true;
    setPage(null);
    setError("");
    listGoodsReceipts({ branchRef: branchRef || undefined, status, cursor: currentCursor, limit: 20 })
      .then(data => {
        if (active) setPage(data);
      })
      .catch(cause => {
        if (active) setError(cause instanceof Error ? cause.message : "Không tải được danh sách phiếu nhập");
      });
    return () => { active = false; };
  }, [canRead, branchRef, status, currentCursor, revision]);

  function selectStatus(next: StatusTab) {
    setStatus(next);
    setCursors([""]);
  }

  if (!canRead && !canCreate) {
    return <ErrorState denied title="Bạn không có quyền truy cập phiếu nhập kho" />;
  }

  return (
    <PageShell>
      <PageHeading
        className="mb-5"
        title="Phiếu nhập kho"
        description="Theo dõi phiếu nhập từ nhà cung cấp và tiến hành nhận hàng thực tế tại bếp trung tâm."
        actions={
          canCreate && (
            <Link className={buttonVariants({ size: "sm" })} href="/inventory/goods-receipts/new">
              <Plus className="mr-1.5 size-4" aria-hidden="true" />
              Tạo phiếu nhập
            </Link>
          )
        }
      />
      <InventoryFlowBar current="receipts" />

      {!canRead ? (
        <EmptyState
          title="Bạn có thể tạo phiếu nhập mới"
          description="Vai trò hiện tại không có quyền xem danh sách phiếu nhập."
        />
      ) : (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Lọc trạng thái phiếu nhập">
            {STATUS_TABS.map(tab => (
              <Button
                key={tab.value || "ALL"}
                type="button"
                size="sm"
                variant={status === tab.value ? "secondary" : "outline"}
                onClick={() => selectStatus(tab.value)}
              >
                {tab.label}
              </Button>
            ))}
          </div>

          {error ? (
            <ErrorState title={error} onRetry={() => setRevision(v => v + 1)} />
          ) : !page ? (
            <LoadingState title="Đang tải danh sách phiếu nhập" />
          ) : page.items.length === 0 ? (
            <EmptyState
              title="Chưa có phiếu nhập phù hợp"
              description={status ? "Thử chuyển bộ lọc trạng thái khác hoặc tạo phiếu nhập mới." : "Hãy tạo phiếu nhập đầu tiên để bắt đầu nhận hàng."}
            />
          ) : (
            <div className="overflow-hidden rounded-lg border">
              <Table>
                <TableHeader className="bg-muted/40">
                  <TableRow className="hover:bg-transparent">
                    <TableHead>Nhà cung cấp</TableHead>
                    <TableHead>Ngày tạo / Dự kiến</TableHead>
                    <TableHead className="text-right">Thực nhận / Dự kiến</TableHead>
                    <TableHead className="text-right">Tổng tiền</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead className="text-right">Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {page.items.map(receipt => {
                    const receivable = ["DRAFT", "IN_PROGRESS", "RECEIVING"].includes(receipt.status);
                    return (
                      <TableRow key={receipt.id}>
                        <TableCell className="whitespace-normal">
                          <p className="font-medium">{receipt.supplier_name}</p>
                          <p className="font-mono text-xs text-muted-foreground">
                            {receipt.supplier_code} · {receipt.lines.length} dòng hàng
                          </p>
                        </TableCell>
                        <TableCell>
                          <p className="text-sm tabular-nums">{formatDate(receipt.created_at)}</p>
                          <p className="text-xs text-muted-foreground tabular-nums">
                            Dự kiến: {formatDate(receipt.expected_at)}
                          </p>
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          <span className="font-medium">{formatQty(receipt.actual_quantity)}</span>
                          <span className="text-xs text-muted-foreground"> / {formatQty(receipt.expected_quantity)}</span>
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {formatVND(receipt.total_amount_vnd)}
                        </TableCell>
                        <TableCell>
                          <StatusBadge tone={statusTone(receipt.status)}>
                            {RECEIPT_STATUS_LABELS[receipt.status] ?? receipt.status}
                          </StatusBadge>
                        </TableCell>
                        <TableCell className="text-right">
                          {receivable && canReceive ? (
                            <Link
                              className={buttonVariants({ variant: "outline", size: "sm" })}
                              href={{
                                pathname: `/inventory/goods-receipts/${encodeURIComponent(receipt.id)}/receive`,
                                query: { supplier: receipt.supplier_ref },
                              }}
                            >
                              Nhận hàng
                            </Link>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}

          {page && (page.items.length > 0 || cursors.length > 1) && (
            <TablePager
              status={`Trang ${cursors.length}`}
              busy={!page && !error}
              hasPrevious={cursors.length > 1}
              onPrevious={() => setCursors(prev => (prev.length > 1 ? prev.slice(0, -1) : prev))}
              hasNext={Boolean(page?.next_cursor)}
              onNext={() => {
                if (page?.next_cursor) setCursors(prev => [...prev, page.next_cursor]);
              }}
            />
          )}
        </div>
      )}
    </PageShell>
  );
}
