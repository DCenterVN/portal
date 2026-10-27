"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { EntityPicker } from "@/components/ui/entity-picker";
import { PageShell, PageHeader } from "@/components/ui/page";
import { EmptyState, ErrorState, Skeleton } from "@/components/ui/state";
import { ReceiptDateInput } from "./receipt-date-input";
import { ReceiptLinesTable } from "./receipt-lines-table";
import { useGoodsReceipt } from "./use-goods-receipt";

export type GoodsReceiptViewProps = ReturnType<typeof useGoodsReceipt>;

export function GoodsReceiptForm() {
  return <GoodsReceiptView {...useGoodsReceipt()} />;
}

export function GoodsReceiptView(props: GoodsReceiptViewProps) {
  const { allowed, setupKind, suppliers, materials, supplier, date, rows, busy, success, error, reconfirm, valid, pricesKind, canUpdate } = props;
  if (!allowed) return <ErrorState denied title="Bạn cần quyền tạo phiếu và đọc nhà cung cấp" />;
  return <PageShell><PageHeader title="Tạo phiếu nhập" description="Lưu nháp hàng dự kiến nhận, chưa ghi tăng tồn. Giá tham chiếu được tự điền, bạn có thể nhập giá thực tế." />
    {setupKind === "loading" && <Skeleton title="Đang tải nhà cung cấp, nguyên liệu và chi nhánh" />}
    {setupKind === "error" && <ErrorState title="Không tải được dữ liệu tạo phiếu" onRetry={props.onRetry} />}
    {setupKind === "ready" && suppliers.length === 0 && <EmptyState title="Chưa có nhà cung cấp đang hợp tác" action={<Link href="/inventory/suppliers">Mở nhà cung cấp</Link>} />}
    {success ? <p role="status" className="my-6">{success}</p> : <form onSubmit={props.onSubmit} className="mt-6 grid min-w-0 gap-4">
      <fieldset disabled={busy || setupKind !== "ready"} className="grid min-w-0 gap-4">
        <EntityPicker label="Nhà cung cấp" name="receipt-supplier" serializeValue={false} items={suppliers} status={setupKind}
          getId={item => item.id} getLabel={item => item.name} getMeta={item => item.code} value={supplier} onChange={props.onSupplier} required />
        <ReceiptDateInput value={date} onChange={props.onDate} disabled={busy} />
        <p className="text-xs text-fg-3">Giá tham chiếu theo nguyên liệu, đơn vị và ngày dự kiến. Nhập đơn giá thực tế nếu chưa có bảng giá hoặc giá đã thay đổi.</p>
        <ReceiptLinesTable rows={rows} materials={materials} status={setupKind} supplierSelected={Boolean(supplier)} busy={busy}
          onPrice={props.onPrice} onSku={props.onSku} onQuantity={props.onQuantity} onAdd={props.onAdd} onRemove={props.onRemove} />
      </fieldset>
      {supplier && rows.some(row => row.sku && row.referencePrice === undefined) && pricesKind === "ready" && <p>Chưa có giá tham chiếu cho một số dòng. Nhập đơn giá thực tế để tiếp tục.</p>}
      {supplier && canUpdate && <Link href={`/inventory/suppliers/${encodeURIComponent(supplier)}?tab=agreements`}>Mở bảng giá nhà cung cấp đã chọn</Link>}
      {pricesKind === "error" && <ErrorState title="Không tải được bảng giá hợp đồng" onRetry={props.onPriceRetry} />}
      {error && <p role="alert">{error}</p>}
      {reconfirm && pricesKind === "ready" && <Button type="button" variant="outline" onClick={props.onReconfirm}>Tôi đã kiểm tra lại bảng giá</Button>}
      {!valid && <p>Chọn nhà cung cấp, nguyên liệu, số lượng và đơn giá hợp lệ cho mọi dòng để tạo phiếu.</p>}
      <Button type="submit" disabled={!valid || busy}>{busy ? "Đang tạo phiếu…" : "Tạo phiếu nhập"}</Button>
    </form>}
  </PageShell>;
}
