"use client";

import Link from "next/link";
import { ErrorState } from "@/components/patterns/empty-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { StatusBadge } from "@/components/patterns/status-badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PageShell } from "@/components/ui/page";
import { PageHeading } from "@/components/patterns/page-heading";
import { EntityPicker } from "@/components/patterns/entity-picker";
import type { ShelfPlacement } from "@/lib/api/production";
import { useShelfPlacement } from "./use-shelf-placement";

interface ShelvesViewProps {
  initialPlacements?: ShelfPlacement[];
}

export function ShelvesView({ initialPlacements }: ShelvesViewProps) {
  const { placements, listLoading, listError, reload, showCreate, setShowCreate, shelfCode, setShelfCode, finishedLotRef, setFinishedLotRef, branchRef, placedQty, setPlacedQty, loading, lots, lotStatus, canPlace, handlePlace } = useShelfPlacement(initialPlacements);

  return (
    <PageShell>
      <PageHeading
        title="Quản lý Kệ hàng & Tem Truy xuất QR (VT-08 / VT-16)"
        description="Đưa các lô thành phẩm đã QC đạt lên kệ chi nhánh và quản lý mã QR truy vết"
        actions={
          <Button variant={showCreate ? "outline" : "default"} onClick={() => setShowCreate(true)} disabled={!canPlace || !branchRef}>
            Đưa lô thành phẩm lên kệ
          </Button>
        }
      />

      {showCreate && (
        <Card className="mb-6">
          <CardContent className="pt-6">
            <form onSubmit={handlePlace} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <EntityPicker
                  label="Lô thành phẩm đã QC đạt"
                  name="finished-lot"
                  serializeValue={false}
                  maxOptions={20}
                  required
                  items={lots}
                  status={lotStatus}
                  value={finishedLotRef || null}
                  onChange={(id) => setFinishedLotRef(id ?? "")}
                  getId={(order) => order.finished_lot_ref ?? ""}
                  getLabel={(order) => order.order_code}
                  getMeta={(order) => order.finished_lot_expires_at ? `Hạn dùng ${new Date(order.finished_lot_expires_at).toLocaleDateString("vi-VN")}` : "Chưa có hạn dùng"}
                  placeholder="Tìm theo mã lệnh sản xuất"
                  emptyText="Chưa có lô thành phẩm đã QC đạt để chọn"
                />
                <div className="grid gap-1.5">
                  <Label htmlFor="shelf-code">Vị trí Kệ hàng</Label>
                  <Input id="shelf-code" type="text" required placeholder="VD: KE-MAT-01, KE-DONG-02" value={shelfCode} onChange={(e) => setShelfCode(e.target.value)} />
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="shelf-qty">Số lượng đưa lên kệ (EA)</Label>
                  <Input id="shelf-qty" type="number" min="1" required value={placedQty} onChange={(e) => setPlacedQty(Number(e.target.value))} />
                </div>
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={loading || !canPlace || !branchRef || lotStatus !== "ready" || !finishedLotRef}>
                  Xác nhận lên kệ & Sinh mã QR
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowCreate(false)}>Hủy</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {listError ? <ErrorState title={listError} onRetry={reload} className="mb-4" /> : <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Vị trí Kệ</TableHead>
                <TableHead>Mã truy vết QR</TableHead>
                <TableHead>Số lượng trên kệ</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead className="text-right">Tra cứu công khai (VT-01)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {placements.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-6 text-center text-muted-foreground">
                    {listLoading ? "Đang tải kệ hàng…" : "Chưa có mặt hàng nào được đưa lên kệ"}
                  </TableCell>
                </TableRow>
              ) : (
                placements.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.shelf_code}</TableCell>
                    <TableCell className="font-mono text-sm">
                      {p.trace_code}
                    </TableCell>
                    <TableCell>{p.available_quantity} / {p.placed_quantity} {p.uom}</TableCell>
                    <TableCell>
                      <StatusBadge tone={p.status === "PLACED" ? "success" : "neutral"}>
                        {p.status}
                      </StatusBadge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Link
                        href={`/traceability/${encodeURIComponent(p.trace_code)}`}
                        target="_blank"
                        className="text-sm font-medium text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                      >
                        Xem trang QR xuất xứ
                      </Link>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>}
    </PageShell>
  );
}
