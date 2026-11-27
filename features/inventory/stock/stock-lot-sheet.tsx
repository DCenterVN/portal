"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmptyState, LoadingState } from "@/components/patterns/empty-state";
import { InlineAlert } from "@/components/patterns/inline-alert";
import { StatusBadge } from "@/components/patterns/status-badge";
import {
  adjustInventoryLot,
  disposeInventoryLot,
  listStockMovements,
  quarantineInventoryLot,
  type InventoryLotItem,
  type StockMovementItem,
} from "@/lib/api/stock-overview";
import { formatDate, formatDateTime } from "@/lib/format-date";
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

type LotActionKind = "ADJUST" | "QUARANTINE" | "DISPOSE";
type ActiveAction = { kind: LotActionKind; lot: InventoryLotItem };

const MOVEMENT_LABELS: Record<string, { label: string; sign: "+" | "-" | "" }> = {
  LOT_APPROVED_IN: { label: "Nhập kho QC đạt", sign: "+" },
  FINISHED_GOODS_IN: { label: "Nhập thành phẩm", sign: "+" },
  TRANSFER_IN: { label: "Nhận chuyển kho", sign: "+" },
  TRANSFER_OUT: { label: "Xuất chuyển kho", sign: "-" },
  TRANSFER_OUT_REVERSAL: { label: "Hoàn hủy chuyển kho", sign: "+" },
  TRANSIT_LOSS: { label: "Hao hụt vận chuyển", sign: "-" },
  SHELF_PLACEMENT: { label: "Đưa lên kệ", sign: "" },
  PRODUCTION_CONSUMPTION: { label: "Xuất sản xuất", sign: "-" },
  SALE: { label: "Xuất bán hàng", sign: "-" },
  SALE_RETURN: { label: "Hoàn đơn hủy", sign: "+" },
  RESERVATION_ALLOCATED: { label: "Giữ chỗ sản xuất", sign: "-" },
  PRODUCTION_ALLOCATED: { label: "Giữ chỗ sản xuất", sign: "-" },
  RESERVATION_CONSUMED: { label: "Xuất giữ chỗ", sign: "-" },
  RESERVATION_RELEASED: { label: "Hoàn giữ chỗ", sign: "+" },
  DELIVERY_RETURN: { label: "Trả hàng giao", sign: "+" },
  STOCK_ADJUSTMENT_IN: { label: "Kiểm kê tăng", sign: "+" },
  STOCK_ADJUSTMENT_OUT: { label: "Kiểm kê giảm", sign: "-" },
  LOT_DISPOSED: { label: "Hủy lô", sign: "-" },
};

const ACTION_TITLES: Record<LotActionKind, string> = {
  ADJUST: "Điều chỉnh số lượng kiểm kê",
  QUARANTINE: "Cách ly lô hàng",
  DISPOSE: "Hủy lô hàng",
};

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
  branchId = "",
  canReadLots,
  canUpdateLots = false,
  canReadQc,
  lotsError,
  onMutated,
  onClose,
}: {
  row: StockRowModel | null;
  branchId?: string;
  canReadLots: boolean;
  canUpdateLots?: boolean;
  canReadQc: boolean;
  lotsError?: string;
  onMutated?: () => void;
  onClose: () => void;
}) {
  const [tab, setTab] = useState<"lots" | "movements">("lots");
  const [action, setAction] = useState<ActiveAction | null>(null);
  const [actualQty, setActualQty] = useState("");
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState("");
  const [movements, setMovements] = useState<StockMovementItem[] | null>(null);
  const [movementsError, setMovementsError] = useState("");
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    setTab("lots");
    setAction(null);
    setActualQty("");
    setReason("");
    setActionError("");
    setMovements(null);
    setMovementsError("");
  }, [row?.skuRef]);

  useEffect(() => {
    if (!row || tab !== "movements" || !branchId) return;
    let live = true;
    setMovementsError("");
    listStockMovements({ branchRef: branchId, skuRef: row.skuRef, limit: 50 })
      .then(page => {
        if (live) setMovements(page.items);
      })
      .catch(cause => {
        if (live) setMovementsError(cause instanceof Error ? cause.message : "Không tải được sổ biến động");
      });
    return () => { live = false; };
  }, [tab, row, branchId, revision]);

  function openAction(kind: LotActionKind, lot: InventoryLotItem) {
    setAction({ kind, lot });
    setActualQty(String(lot.remaining_quantity));
    setReason("");
    setActionError("");
  }

  async function submitAction() {
    if (!action || busy) return;
    const trimmedReason = reason.trim();
    if (!trimmedReason) {
      setActionError("Vui lòng nhập lý do thực hiện.");
      return;
    }
    setBusy(true);
    setActionError("");
    try {
      if (action.kind === "ADJUST") {
        const parsed = Number(actualQty.replace(",", "."));
        if (!Number.isFinite(parsed) || parsed < 0) {
          setActionError("Số lượng kiểm kê phải là số >= 0.");
          setBusy(false);
          return;
        }
        await adjustInventoryLot(action.lot.id, { actual_quantity: parsed, reason: trimmedReason });
      } else if (action.kind === "QUARANTINE") {
        await quarantineInventoryLot(action.lot.id, { reason: trimmedReason });
      } else {
        await disposeInventoryLot(action.lot.id, { reason: trimmedReason });
      }
      setAction(null);
      setReason("");
      setRevision(v => v + 1);
      onMutated?.();
    } catch (cause) {
      setActionError(cause instanceof Error ? cause.message : "Không thể cập nhật lô hàng.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Sheet open={Boolean(row)} onOpenChange={open => { if (!open) onClose(); }}>
      <SheetContent side="right" className="w-full max-w-full gap-0 sm:max-w-[600px]">
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

              <Tabs value={tab} onValueChange={v => setTab(v as "lots" | "movements")}>
                <TabsList>
                  <TabsTrigger value="lots">Lô tồn kho</TabsTrigger>
                  <TabsTrigger value="movements">Sổ biến động</TabsTrigger>
                </TabsList>

                <TabsContent value="lots" className="mt-3 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-sm font-semibold">Chi tiết lô theo thứ tự FEFO</h3>
                    <span className="text-xs text-muted-foreground">Hết hạn trước xếp trên</span>
                  </div>

                  {action && (
                    <div className="space-y-3 rounded-lg border bg-muted/30 p-3">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-xs font-semibold">
                          {ACTION_TITLES[action.kind]} · <span className="font-mono">{action.lot.supplier_lot_code}</span>
                        </p>
                        <Button type="button" size="sm" variant="ghost" disabled={busy} onClick={() => setAction(null)}>
                          Đóng
                        </Button>
                      </div>
                      {action.kind === "ADJUST" && (
                        <div className="space-y-1">
                          <Label htmlFor="lot-adjust-qty" className="text-xs">
                            Số lượng thực tế kiểm kê ({action.lot.uom})
                          </Label>
                          <Input
                            id="lot-adjust-qty"
                            type="text"
                            inputMode="decimal"
                            value={actualQty}
                            disabled={busy}
                            onChange={e => setActualQty(e.target.value)}
                          />
                        </div>
                      )}
                      <div className="space-y-1">
                        <Label htmlFor="lot-action-reason" className="text-xs">Lý do thực hiện</Label>
                        <Input
                          id="lot-action-reason"
                          type="text"
                          value={reason}
                          disabled={busy}
                          placeholder={action.kind === "ADJUST" ? "Ví dụ: Kiểm kê định kỳ cuối ngày" : "Ví dụ: Bao bì rách / Nghi nhiễm chéo"}
                          onChange={e => setReason(e.target.value)}
                        />
                      </div>
                      {actionError && <InlineAlert>{actionError}</InlineAlert>}
                      <div className="flex items-center justify-end gap-2">
                        <Button type="button" size="sm" variant="outline" disabled={busy} onClick={() => setAction(null)}>
                          Hủy
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant={action.kind === "DISPOSE" ? "destructive" : "default"}
                          disabled={busy}
                          onClick={() => void submitAction()}
                        >
                          {busy ? "Đang xử lý..." : "Xác nhận"}
                        </Button>
                      </div>
                    </div>
                  )}

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
                            {canUpdateLots && <TableHead className="text-right">Thao tác</TableHead>}
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {row.lots.map(lot => {
                            const health = evaluateLotHealth(lot);
                            const status = lotDisplayStatus(lot);
                            const canAdjust = lot.status === "APPROVED" && health !== "EXPIRED";
                            const canQuarantine = lot.status === "APPROVED";
                            const canDispose = lot.status !== "CONSUMED" && lot.status !== "DISPOSED";
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
                                {canUpdateLots && (
                                  <TableCell className="text-right">
                                    <div className="flex flex-wrap justify-end gap-1">
                                      {canAdjust && (
                                        <Button type="button" size="sm" variant="outline" onClick={() => openAction("ADJUST", lot)}>
                                          Điều chỉnh
                                        </Button>
                                      )}
                                      {canQuarantine && (
                                        <Button type="button" size="sm" variant="outline" onClick={() => openAction("QUARANTINE", lot)}>
                                          Cách ly
                                        </Button>
                                      )}
                                      {canDispose && (
                                        <Button type="button" size="sm" variant="destructive" onClick={() => openAction("DISPOSE", lot)}>
                                          Hủy lô
                                        </Button>
                                      )}
                                    </div>
                                  </TableCell>
                                )}
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="movements" className="mt-3 space-y-3">
                  {movementsError ? (
                    <InlineAlert>{movementsError}</InlineAlert>
                  ) : movements === null ? (
                    <LoadingState title="Đang tải sổ biến động tồn kho" />
                  ) : movements.length === 0 ? (
                    <EmptyState
                      title="Chưa có biến động tồn kho"
                      description="Các giao dịch nhập, xuất, chuyển kho, kiểm kê hoặc hủy lô sẽ hiển thị tại đây."
                    />
                  ) : (
                    <div className="overflow-hidden rounded-lg border">
                      <Table>
                        <TableHeader className="bg-muted/40">
                          <TableRow className="hover:bg-transparent">
                            <TableHead>Thời gian</TableHead>
                            <TableHead>Nghiệp vụ & Lô</TableHead>
                            <TableHead className="text-right">Biến động</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {movements.map(item => {
                            const meta = MOVEMENT_LABELS[item.movement_type] ?? { label: item.movement_type, sign: "" };
                            return (
                              <TableRow key={item.id}>
                                <TableCell className="text-xs tabular-nums text-muted-foreground">
                                  {formatDateTime(item.created_at) || "—"}
                                </TableCell>
                                <TableCell className="whitespace-normal">
                                  <p className="text-xs font-medium">{meta.label}</p>
                                  <p className="font-mono text-xs text-muted-foreground">
                                    {item.supplier_lot_code || "Lô hàng"}
                                  </p>
                                  {item.notes && (
                                    <p className="text-xs text-muted-foreground">{item.notes}</p>
                                  )}
                                </TableCell>
                                <TableCell className={cn(
                                  "text-right text-xs font-semibold tabular-nums",
                                  meta.sign === "+" && "text-emerald-700 dark:text-emerald-400",
                                  meta.sign === "-" && "text-destructive",
                                )}>
                                  {meta.sign}{formatQuantity(item.quantity, item.uom)}
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
