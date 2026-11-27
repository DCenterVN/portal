"use client";

import { useState } from "react";
import Link from "next/link";
import type { Route } from "next";
import { Button, buttonVariants } from "@/components/ui/button";
import { PageShell } from "@/components/ui/page";
import { PageHeading } from "@/components/patterns/page-heading";
import { EmptyState, ErrorState, LoadingState } from "@/components/patterns/empty-state";
import { StatusBadge, statusTone } from "@/components/patterns/status-badge";
import { formatVND } from "@/lib/format";
import { formatDate } from "@/lib/format-date";
import { ReceiptDateInput } from "./receipt-date-input";
import { ReceiptSupplierSheet } from "./receipt-supplier-sheet";
import { ReceiptSupplierField } from "./receipt-supplier-field";
import { ReceiptLinesTable } from "./receipt-lines-table";
import { missingHint } from "./receipt-lines";
import { useGoodsReceipt } from "./use-goods-receipt";
import { InlineAlert } from "@/components/patterns/inline-alert";
import { InventoryFlowBar } from "./inventory-flow-bar";

type ReceiptModel = ReturnType<typeof useGoodsReceipt>;
export type GoodsReceiptViewProps = Omit<ReceiptModel, "selectedSupplier" | "priceTable" | "onAddMaterial" | "receiveHref" | "canReceive" | "categories" | "pricedCount" | "referenceOf" | "unpricedIds" | "openReceipts"> & Partial<Pick<ReceiptModel, "unpricedIds" | "selectedSupplier" | "priceTable" | "onAddMaterial" | "receiveHref" | "canReceive" | "categories" | "pricedCount" | "referenceOf" | "openReceipts">>;

const receiptStatuses: Record<string, string> = { DRAFT: "Nháp", RECEIVING: "Đang nhận", IN_PROGRESS: "Đang nhận" };

export function GoodsReceiptForm() {
  return <GoodsReceiptView {...useGoodsReceipt()} />;
}

export function GoodsReceiptView(props: GoodsReceiptViewProps) {
  const { allowed, setupKind, suppliers, materials, supplier, date, rows, busy, success, error, reconfirm, valid, pricesKind } = props;
  const [profileOpen, setProfileOpen] = useState(false);
  const hint = missingHint(Boolean(supplier), rows);
  if (!allowed) return <ErrorState denied title="Bạn cần quyền tạo phiếu và đọc nhà cung cấp" />;
  return <PageShell><PageHeading title="Tạo phiếu nhập" description="Lưu nháp hàng dự kiến nhận, chưa ghi tăng tồn. Giá tham chiếu được tự điền, bạn có thể nhập giá thực tế." actions={<Link className={buttonVariants({ variant: "outline", size: "sm" })} href="/inventory/inbound-qc">Sang kiểm đầu vào</Link>} />
    <InventoryFlowBar current="receipts" />
    {setupKind === "loading" && <LoadingState title="Đang tải nhà cung cấp, nguyên liệu và chi nhánh" />}
    {setupKind === "error" && <ErrorState title="Không tải được dữ liệu tạo phiếu" onRetry={props.onRetry} />}
    {setupKind === "ready" && suppliers.length === 0 && <EmptyState title="Chưa có nhà cung cấp nào có giá cho ngày này" action={<Link href="/inventory/suppliers">Mở nhà cung cấp</Link>} />}
    {success ? <div className="my-6 grid gap-3"><p role="status">{success}</p>{props.canReceive && props.receiveHref && <Link className={buttonVariants({ variant: "default" })} href={props.receiveHref as Route}>Nhận hàng ngay</Link>}</div> : <>
      {props.openReceipts && props.openReceipts.length > 0 && (
        <section aria-label="Phiếu nhập đang mở" className="mt-4 rounded-lg border bg-card px-4 py-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-sm font-semibold">Phiếu nhập đang mở</h2>
            <span className="text-xs text-muted-foreground tabular-nums">{props.openReceipts.length} phiếu</span>
          </div>
          <div className="mt-2 divide-y divide-border">
            {props.openReceipts.map(receipt => (
              <div key={receipt.id} className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium">{formatDate(receipt.expected_at || receipt.created_at)}</span>
                  <StatusBadge tone={statusTone(receipt.status)}>{receiptStatuses[receipt.status] ?? "Đang xử lý"}</StatusBadge>
                  <span className="text-xs text-muted-foreground">{receipt.lines.length} dòng hàng · {formatVND(receipt.total_amount_vnd)}</span>
                </div>
                <Button asChild variant="outline" size="sm">
                  <Link href={`/inventory/goods-receipts/${encodeURIComponent(receipt.id)}/receive?supplier=${encodeURIComponent(supplier)}` as Route}>Nhận hàng tiếp</Link>
                </Button>
              </div>
            ))}
          </div>
        </section>
      )}
      <form onSubmit={props.onSubmit} className="mt-6 grid min-w-0 gap-4">
      <fieldset disabled={busy || setupKind !== "ready"} className="grid min-w-0 gap-4">
        <div className="grid gap-4 md:grid-cols-3 md:items-start">
          <div className="md:col-span-2"><ReceiptSupplierField onOpenProfile={props.selectedSupplier && props.onAddMaterial ? () => setProfileOpen(true) : undefined} selected={props.selectedSupplier} suppliers={suppliers} unpricedIds={props.unpricedIds} categories={props.categories ?? []} status={setupKind} value={supplier} onChange={props.onSupplier} pricedCount={props.pricedCount ?? null} /></div>
          <ReceiptDateInput value={date} onChange={props.onDate} disabled={busy} />
        </div>
        {props.selectedSupplier && props.onAddMaterial && <ReceiptSupplierSheet supplier={props.selectedSupplier} open={profileOpen} onOpenChange={setProfileOpen} priceTable={props.priceTable ?? []} pricesReady={pricesKind === "ready"}
          usedAt={sku => rows.findIndex(row => row.sku === sku)} onAddMaterial={props.onAddMaterial} />}
        <ReceiptLinesTable referenceOf={props.referenceOf} rows={rows} materials={materials} status={setupKind} supplierSelected={Boolean(supplier)} busy={busy}
          onPrice={props.onPrice} onSku={props.onSku} onQuantity={props.onQuantity} onAdd={props.onAdd} onRemove={props.onRemove} />
      </fieldset>
      {pricesKind === "error" && <ErrorState title="Không tải được bảng giá hợp đồng" onRetry={props.onPriceRetry} />}
      {error && <InlineAlert>{error}</InlineAlert>}
      {reconfirm && pricesKind === "ready" && <Button type="button" variant="outline" onClick={props.onReconfirm}>Tôi đã kiểm tra lại bảng giá</Button>}
      <div className="flex flex-wrap items-center justify-end gap-3">
        {!valid && hint && <p className="text-xs text-muted-foreground">{hint}</p>}
        <Button type="submit" className="w-fit" disabled={!valid || busy}>{busy ? "Đang tạo phiếu…" : "Tạo phiếu nhập"}</Button>
      </div>
    </form></>}
  </PageShell>;
}
