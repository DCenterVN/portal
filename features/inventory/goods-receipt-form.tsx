"use client";

import { useState } from "react";
import Link from "next/link";
import type { Route } from "next";
import { Button, buttonVariants } from "@/components/ui/button";
import { PageShell } from "@/components/ui/page";
import { PageHeading } from "@/components/patterns/page-heading";
import { EmptyState, ErrorState, LoadingState } from "@/components/patterns/empty-state";
import { ReceiptDateInput } from "./receipt-date-input";
import { ReceiptSupplierSheet } from "./receipt-supplier-sheet";
import { ReceiptSupplierField } from "./receipt-supplier-field";
import { ReceiptLinesTable } from "./receipt-lines-table";
import { missingHint } from "./receipt-lines";
import { useGoodsReceipt } from "./use-goods-receipt";
import { InlineAlert } from "@/components/patterns/inline-alert";

type ReceiptModel = ReturnType<typeof useGoodsReceipt>;
export type GoodsReceiptViewProps = Omit<ReceiptModel, "selectedSupplier" | "priceTable" | "onAddMaterial" | "receiveHref" | "canReceive" | "categories" | "pricedCount" | "referenceOf" | "unpricedIds"> & Partial<Pick<ReceiptModel, "unpricedIds" | "selectedSupplier" | "priceTable" | "onAddMaterial" | "receiveHref" | "canReceive" | "categories" | "pricedCount" | "referenceOf">>;

export function GoodsReceiptForm() {
  return <GoodsReceiptView {...useGoodsReceipt()} />;
}

export function GoodsReceiptView(props: GoodsReceiptViewProps) {
  const { allowed, setupKind, suppliers, materials, supplier, date, rows, busy, success, error, reconfirm, valid, pricesKind } = props;
  const [profileOpen, setProfileOpen] = useState(false);
  const hint = missingHint(Boolean(supplier), rows);
  if (!allowed) return <ErrorState denied title="Bạn cần quyền tạo phiếu và đọc nhà cung cấp" />;
  return <PageShell><PageHeading title="Tạo phiếu nhập" description="Lưu nháp hàng dự kiến nhận, chưa ghi tăng tồn. Giá tham chiếu được tự điền, bạn có thể nhập giá thực tế." />
    {setupKind === "loading" && <LoadingState title="Đang tải nhà cung cấp, nguyên liệu và chi nhánh" />}
    {setupKind === "error" && <ErrorState title="Không tải được dữ liệu tạo phiếu" onRetry={props.onRetry} />}
    {setupKind === "ready" && suppliers.length === 0 && <EmptyState title="Chưa có nhà cung cấp nào có giá cho ngày này" action={<Link href="/inventory/suppliers">Mở nhà cung cấp</Link>} />}
    {success ? <div className="my-6 grid gap-3"><p role="status">{success}</p>{props.canReceive && props.receiveHref && <Link className={buttonVariants({ variant: "default" })} href={props.receiveHref as Route}>Nhận hàng ngay</Link>}</div> : <form onSubmit={props.onSubmit} className="mt-6 grid min-w-0 gap-4">
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
    </form>}
  </PageShell>;
}
