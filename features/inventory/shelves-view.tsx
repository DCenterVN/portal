"use client";

import { formatDate } from "@/lib/format-date";
import Link from "next/link";
import { ErrorState } from "@/components/patterns/empty-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/patterns/form-field";
import { InlineAlert } from "@/components/patterns/inline-alert";
import { StatusBadge, statusTone } from "@/components/patterns/status-badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { PageShell } from "@/components/ui/page";
import { PageHeading } from "@/components/patterns/page-heading";
import { TablePager } from "@/components/patterns/table-pager";
import type { ShelfPlacement } from "@/lib/api/production";
import { pendingRowView } from "./shelf-pending-rules";
import { uomLabel } from "@/lib/stock-transfer";
import { skuStatusNote } from "./transfers/name-lookup";
import { NamesLoadError } from "./transfers/names-load-error";
import { useShelfPlacement } from "./use-shelf-placement";

interface ShelvesViewProps {
  initialPlacements?: ShelfPlacement[];
}

export function ShelvesView({ initialPlacements }: ShelvesViewProps) {
  const { placementsList: list, pending, productName, branchRef, selected, choose, shelfCode, setShelfCode, placedQty, setPlacedQty, error, loading, canPlace, handlePlace, inspected, setInspected, inspectionNeeded } = useShelfPlacement(initialPlacements);
  const { items: placements, loading: listLoading, error: listError, reload } = list;

  return (
    <PageShell>
      <PageHeading
        title="Kệ hàng và tem truy xuất"
        description="Xếp hàng chờ lên kệ của chi nhánh (từ sản xuất, chuyển kho hoặc hàng giao hỏng quay về) và quản lý mã QR truy vết"
      />

      <h2 className="mb-2 text-base font-semibold">Hàng chờ lên kệ</h2>
      {productName.failed && <NamesLoadError retry={productName.retry} />}
      {pending.error ? <ErrorState title={pending.error} onRetry={pending.reload} className="mb-4" /> : <Card className="mb-4">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tên hàng</TableHead>
                <TableHead>Số lô</TableHead>
                <TableHead>Hạn dùng</TableHead>
                <TableHead>Chờ lên kệ</TableHead>
                <TableHead>Nguồn hàng</TableHead>
                <TableHead className="text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pending.items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-6 text-center text-muted-foreground">
                    {pending.loading ? "Đang tải hàng chờ lên kệ…" : "Không có hàng nào đang chờ lên kệ"}
                  </TableCell>
                </TableRow>
              ) : pending.items.map((lot) => {
                const view = pendingRowView(lot);
                return (
                  <TableRow key={lot.lot_id}>
                    <TableCell className="font-medium">{productName(lot.sku_ref)}{skuStatusNote(productName.status(lot.sku_ref)) && <StatusBadge tone="warning" className="ml-2">{skuStatusNote(productName.status(lot.sku_ref))}</StatusBadge>}</TableCell>
                    <TableCell className="font-mono text-sm">{lot.supplier_lot_code}</TableCell>
                    <TableCell>{lot.expires_at ? formatDate(lot.expires_at) : "Chưa có hạn dùng"}</TableCell>
                    <TableCell>{view.pending}</TableCell>
                    <TableCell>
                      <div>{view.originLabel}{view.source && <span className="text-muted-foreground"> · {view.source}</span>}</div>
                      {view.inspection && <div className="text-sm font-medium text-destructive">{view.inspection}</div>}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant="outline" disabled={!canPlace || !branchRef} onClick={() => choose(lot)}>Xếp lên kệ</Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>}
      <TablePager label="Phân trang hàng chờ lên kệ" busy={pending.loading} status={`Trang ${pending.page}`} hasPrevious={pending.hasPrevious} onPrevious={pending.previous} hasNext={pending.hasNext} onNext={pending.next} />

      {selected && (
        <Card className="mb-6">
          <CardContent className="pt-6">
            <form onSubmit={handlePlace} className="space-y-4">
              <p className="text-sm">Xếp lô <span className="font-medium">{productName(selected.sku_ref)}</span> (số lô {selected.supplier_lot_code}), đang chờ {pendingRowView(selected).pending}</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Vị trí Kệ hàng" htmlFor="shelf-code">
                  <Input id="shelf-code" type="text" required placeholder="VD: KE-MAT-01, KE-DONG-02" value={shelfCode} onChange={(e) => setShelfCode(e.target.value)} />
                </Field>
                <Field label={`Số lượng đưa lên kệ (${uomLabel(selected.uom)})`} htmlFor="shelf-qty" hint={`Tối đa ${selected.pending_quantity}`}>
                  <Input id="shelf-qty" type="number" min="1" max={selected.pending_quantity} required value={placedQty} onChange={(e) => setPlacedQty(Number(e.target.value))} />
                </Field>
              </div>
              {selected.origin === "DELIVERY_RETURN" && (
                <div className="space-y-1">
                  <Label htmlFor="shelf-inspected" className="cursor-pointer"><Checkbox id="shelf-inspected" checked={inspected} onCheckedChange={(checked) => setInspected(checked === true)} />Đã kiểm, hàng còn dùng được</Label>
                  {inspectionNeeded && <p className="text-sm text-muted-foreground">{inspectionNeeded}</p>}
                </div>
              )}
              {error && <InlineAlert>{error}</InlineAlert>}
              <div className="flex gap-2">
                <Button type="submit" disabled={loading || !canPlace || !branchRef || Boolean(inspectionNeeded)}>Xác nhận lên kệ & Sinh mã QR</Button>
                <Button type="button" variant="outline" onClick={() => choose(null)}>Hủy</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <h2 className="mb-2 mt-6 text-base font-semibold">Hàng đã lên kệ</h2>
      {listError ? <ErrorState title={listError} onRetry={reload} className="mb-4" /> : <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Vị trí Kệ</TableHead>
                <TableHead>Mã truy vết QR</TableHead>
                <TableHead>Số lượng trên kệ</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead className="text-right">Tra cứu xuất xứ</TableHead>
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
                    <TableCell>{p.available_quantity} / {p.placed_quantity} {uomLabel(p.uom)}</TableCell>
                    <TableCell>
                      <StatusBadge tone={statusTone(p.status)}>
                        {{ PLACED: "Đang trên kệ", SELLING: "Đang bán", EMPTY: "Đã hết hàng", DEPLETED: "Đã hết hàng", REMOVED: "Đã gỡ khỏi kệ" }[p.status] ?? "Đang cập nhật"}
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
      <TablePager label="Phân trang kệ hàng" busy={listLoading} status={`Trang ${list.page}`} hasPrevious={list.hasPrevious} onPrevious={list.previous} hasNext={list.hasNext} onNext={list.next} />
    </PageShell>
  );
}
