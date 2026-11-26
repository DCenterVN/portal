"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { InlineAlert } from "@/components/patterns/inline-alert";
import { StatusBadge } from "@/components/patterns/status-badge";
import { formatDate } from "@/lib/format-date";
import { statusLabel } from "@/lib/status-labels";
import { formatQuantity } from "@/lib/stock-transfer";
import { cn } from "@/lib/utils";
import {
  evaluateLotHealth,
  formatExpiryDelta,
  lotDisplayStatus,
  stockGroupLabels,
  type StockRowModel,
} from "./stock-model";

function MetricBox({ label, value, muted = false }: { label: string; value: string; muted?: boolean }) {
  return (
    <div className="rounded-lg border bg-muted/20 px-3 py-2">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={cn("mt-0.5 text-sm font-semibold tabular-nums", muted && "text-destructive")}>{value}</p>
    </div>
  );
}

export function StockLotSheet({
  row,
  canReadLots,
  canReadQc,
  lotsError,
  onClose,
}: {
  row: StockRowModel | null;
  canReadLots: boolean;
  canReadQc: boolean;
  lotsError?: string;
  onClose: () => void;
}) {
  return (
    <Sheet open={Boolean(row)} onOpenChange={open => { if (!open) onClose(); }}>
      <SheetContent side="right" className="w-full gap-0 sm:max-w-[580px]">
        {row && (
          <>
            <SheetHeader className="border-b px-5 py-4">
              <SheetTitle>{row.name}</SheetTitle>
              <SheetDescription asChild>
                <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <Badge variant="outline" className="font-normal">{stockGroupLabels[row.group]}</Badge>
                  {row.skuCode && <span className="font-mono">{row.skuCode}</span>}
                  {row.skuStatus && row.skuStatus !== "ACTIVE" && (
                    <StatusBadge tone="warning">{statusLabel(row.skuStatus)}</StatusBadge>
                  )}
                </div>
              </SheetDescription>
            </SheetHeader>

            <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
              <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                <MetricBox
                  label="Dùng được"
                  value={formatQuantity(row.usable, row.uom)}
                  muted={row.unusable > 0 && row.usable <= 0}
                />
                <MetricBox label="Tổng tồn sổ" value={formatQuantity(row.onHand, row.uom)} />
                <MetricBox label="Đang giữ lệnh" value={formatQuantity(row.reserved, row.uom)} />
                {row.group === "FINISHED" ? (
                  <MetricBox
                    label="Chờ kệ / Trên kệ"
                    value={`${formatQuantity(row.shelfPending, row.uom)} / ${formatQuantity(row.sellable, row.uom)}`}
                  />
                ) : row.unusable > 0 ? (
                  <MetricBox
                    label="Không dùng được"
                    value={formatQuantity(row.unusable, row.uom)}
                    muted
                  />
                ) : (
                  <MetricBox
                    label="Chờ kiểm QC"
                    value={formatQuantity(row.pendingQcQty, row.uom)}
                  />
                )}
              </div>

              {(row.unusable > 0 || row.pendingQcQty > 0) && (
                <InlineAlert>
                  <span>{row.issueSummary}.</span>
                  {row.pendingQcQty > 0 && canReadQc && (
                    <Link href="/inventory/inbound-qc" className="ml-2 font-medium underline">
                      Sang Kiểm đầu vào
                    </Link>
                  )}
                  {row.shelfPending > 0 && row.group === "FINISHED" && (
                    <Link href="/inventory/shelves" className="ml-2 font-medium underline">
                      Sang Kệ hàng
                    </Link>
                  )}
                </InlineAlert>
              )}

              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-sm font-semibold">Chi tiết lô theo thứ tự FEFO</h3>
                  <span className="text-xs text-muted-foreground">Hết hạn trước xếp trên</span>
                </div>

                {!canReadLots ? (
                  <p className="rounded-lg border bg-muted/30 p-3 text-xs text-muted-foreground">
                    Vai trò hiện tại chỉ xem tồn tổng hợp theo mặt hàng; cần quyền xem lô hàng để kiểm tra số lô và hạn sử dụng chi tiết.
                  </p>
                ) : lotsError ? (
                  <InlineAlert>{lotsError}</InlineAlert>
                ) : row.lots.length === 0 ? (
                  <p className="rounded-lg border bg-muted/20 p-3 text-xs text-muted-foreground">
                    Chưa ghi nhận lô nào cho mặt hàng này tại chi nhánh đang chọn.
                  </p>
                ) : (
                  <div className="overflow-hidden rounded-lg border">
                    <Table>
                      <TableHeader className="bg-muted/40">
                        <TableRow className="hover:bg-transparent">
                          <TableHead>Số lô & vị trí</TableHead>
                          <TableHead className="text-right">Còn / Nhập</TableHead>
                          <TableHead>Hạn dùng</TableHead>
                          <TableHead>Trạng thái</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {row.lots.map(lot => {
                          const health = evaluateLotHealth(lot);
                          const status = lotDisplayStatus(lot);
                          return (
                            <TableRow key={lot.id} className={cn(health === "DEPLETED" && "opacity-60")}>
                              <TableCell className="whitespace-normal">
                                <p className="font-mono text-xs font-medium">{lot.supplier_lot_code}</p>
                                <p className="text-xs text-muted-foreground">
                                  {lot.storage_location_code || "Chưa gán vị trí"}
                                  {lot.received_temperature_celsius !== null ? ` · ${lot.received_temperature_celsius}°C` : ""}
                                </p>
                              </TableCell>
                              <TableCell className="text-right tabular-nums">
                                <span className="font-medium">{formatQuantity(lot.remaining_quantity, lot.uom)}</span>
                                <span className="text-xs text-muted-foreground"> / {formatQuantity(lot.initial_quantity, lot.uom)}</span>
                              </TableCell>
                              <TableCell className="whitespace-normal">
                                <p className="text-xs font-medium tabular-nums">
                                  {lot.expires_at ? formatDate(lot.expires_at) : "—"}
                                </p>
                                <p className={cn(
                                  "text-xs",
                                  health === "EXPIRED" ? "font-medium text-destructive" : health === "EXPIRING_SOON" ? "font-medium text-warning" : "text-muted-foreground",
                                )}>
                                  {formatExpiryDelta(lot.expires_at)}
                                </p>
                              </TableCell>
                              <TableCell>
                                <StatusBadge tone={status.tone}>{status.label}</StatusBadge>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
