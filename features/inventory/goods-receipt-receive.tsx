"use client";

import { toISODate } from "@/lib/format-date";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/patterns/form-field";
import { Input } from "@/components/ui/input";
import { PageShell } from "@/components/ui/page";
import { PageHeading } from "@/components/patterns/page-heading";
import { EmptyState, ErrorState, LoadingState } from "@/components/patterns/empty-state";
import { ReceiptDateInput, formatReceiptDate, parseReceiptDate, receiptToday } from "./receipt-date-input";
import { ReceiptEvidenceField } from "./receipt-evidence-field";
import { useGoodsReceiptReceive } from "./use-goods-receipt-receive";
import { InlineAlert } from "@/components/patterns/inline-alert";

const images = "image/jpeg,image/png,image/webp";
type Model = ReturnType<typeof useGoodsReceiptReceive>;
type Row = Model["rows"][number];
const statuses: Record<string, string> = { DRAFT: "Nháp", IN_PROGRESS: "Đang nhận", RECEIVING: "Đang nhận", COMPLETED: "Đã hoàn tất", CANCELLED: "Đã hủy" };

function ReceiptLine({ row, model, previous }: { row: Row; model: Model; previous?: File }) {
  const id = row.line.receipt_line_ref;
  const locked = row.done || row.busy || row.submitted || !model.open;
  const patch = (changes: Partial<Row>) => model.patch(id, changes);
  const evidence = { receipt: model.setup.kind === "ready" ? model.setup.receipt.id : "", line: id, attempt: row.attempt, disabled: locked, onReload: model.onReload };
  const title = model.setup.kind === "ready" ? model.setup.names[row.line.sku_ref] : undefined;
  return <article className="grid min-w-0 gap-4 rounded-lg border border-border bg-surface p-6" aria-busy={row.busy}>
    <h2 className="text-xl font-semibold">{title ?? "Nguyên liệu đã ngừng cung cấp"}</h2>
    <p>Dự kiến: <span className="tabular-nums">{row.line.expected_quantity.replace(".", ",")} {row.line.uom}</span></p>
    {row.done ? <p role="status">Đã nhận · {row.line.actual_quantity.replace(".", ",")} {row.line.uom}</p> : <>
      <fieldset disabled={locked} className="grid min-w-0 gap-4 sm:grid-cols-2">
        <Field label="Mã lô nhà cung cấp" htmlFor={`${id}-lot`}><Input id={`${id}-lot`} required value={row.lot} onChange={event => patch({ lot: event.target.value })} /></Field>
        <Field label={`Lượng thực nhận (${row.line.uom})`} htmlFor={`${id}-quantity`} hint="Lớn hơn 0, tối đa 3 số thập phân."><Input id={`${id}-quantity`} inputMode="decimal" required value={row.quantity} onChange={event => patch({ quantity: event.target.value })} /></Field>
        <Field label="Hạn sử dụng" htmlFor={`${id}-expiry`} hint="dd/mm/yyyy, sau hôm nay." validate={value => parseReceiptDate(value) > receiptToday() ? undefined : "Nhập hạn sử dụng hợp lệ sau hôm nay."}>
          <Input id={`${id}-expiry`} inputMode="numeric" placeholder="dd/mm/yyyy" required defaultValue={formatReceiptDate(row.expiry)} onChange={event => patch({ expiry: parseReceiptDate(event.target.value) })} />
        </Field>
        <Field label="Nhiệt độ nhận (°C)" htmlFor={`${id}-temperature`}><Input id={`${id}-temperature`} inputMode="decimal" required value={row.temperature} onChange={event => patch({ temperature: event.target.value })} /></Field>
      </fieldset>
      <div className="grid min-w-0 gap-4 sm:grid-cols-2">
        <ReceiptEvidenceField {...evidence} purpose="DELIVERED_GOODS" label="Ảnh hàng thực nhận" accept={images} hashes={[row.document, row.variance].flatMap(item => item ? [item.sha256] : [])} evidence={row.goods} onChange={goods => patch({ goods })} />
        <ReceiptEvidenceField {...evidence} purpose="DELIVERY_DOCUMENT" label="Chứng từ giao hàng" accept={images} hashes={[row.goods, row.variance].flatMap(item => item ? [item.sha256] : [])} evidence={row.document} previous={previous} onChange={document => patch({ document })} />
      </div>
      {row.quantity && Number(row.quantity.replace(",", ".")) !== Number(row.line.expected_quantity) && <ReceiptEvidenceField {...evidence} purpose="QUANTITY_VARIANCE" label="Ảnh lệch số lượng" accept={images} hashes={[row.goods, row.document].flatMap(item => item ? [item.sha256] : [])} evidence={row.variance} onChange={variance => patch({ variance })} />}
      {row.error && <ErrorState title={row.error} onRetry={row.reload ? model.onReload : () => void model.receive(row)} />}
      {row.reload && <Button variant="outline" onClick={model.onReload}>Tải lại</Button>}
      <p className="text-sm text-muted-foreground">Điền đủ thông tin và tải đủ ảnh để nhận dòng này. Khi gửi lỗi, bấm thử lại để gửi cùng lần nhận.</p>
      <Button disabled={!model.ready(row) || row.reload} onClick={() => void model.receive(row)}>{row.busy ? "Đang nhận…" : row.error ? "Thử lại" : "Nhận dòng này"}</Button>
    </>}
  </article>;
}

function QuantityVariance({ model }: { model: Model }) {
  const row = model.varianceRow;
  if (!row) return null;
  const state = model.varianceState;
  return <section className="grid gap-4 rounded-lg border border-border p-6" aria-label="Ghi lệch số lượng" aria-busy={state.busy}>
    <h2 className="text-xl font-semibold">Ghi lệch số lượng</h2>
    <p>Tổng thực nhận lệch tổng dự kiến hơn 5%. Ghi giải thích và ít nhất một ảnh lệch số lượng.</p>
    {state.done ? <p role="status">Đã ghi lệch số lượng</p> : <>
      <Field label="Giải thích lệch số lượng" htmlFor="variance-explanation"><Input id="variance-explanation" required value={model.explanation} disabled={state.submitted} onChange={event => model.setExplanation(event.target.value)} /></Field>
      {row.variance ? <p>Đã tải lên ảnh lệch số lượng của dòng nhận.</p> : <ReceiptEvidenceField receipt={model.setup.kind === "ready" ? model.setup.receipt.id : ""} line={row.line.receipt_line_ref} attempt={row.attempt} purpose="QUANTITY_VARIANCE" label="Ảnh lệch số lượng" accept={images} onReload={model.onReload} disabled={state.submitted} hashes={[row.goods, row.document].flatMap(item => item ? [item.sha256] : [])} onChange={variance => model.patch(row.line.receipt_line_ref, { variance })} />}
      {state.error && <ErrorState title={state.error} onRetry={state.reload ? model.onReload : () => void model.recordVariance()} />}
      {state.reload && <Button variant="outline" onClick={model.onReload}>Tải lại</Button>}
      <Button disabled={!model.explanation.trim() || !row.variance || state.busy || state.reload} onClick={() => void model.recordVariance()}>{state.busy ? "Đang ghi…" : state.error ? "Thử lại" : "Ghi lệch số lượng"}</Button>
    </>}
  </section>;
}

export function GoodsReceiptReceive({ receiptID, supplierID }: { receiptID: string; supplierID: string }) {
  const model = useGoodsReceiptReceive(receiptID, supplierID);
  if (!model.allowed) return <ErrorState denied title="Bạn cần quyền cập nhật phiếu nhập" />;
  return <PageShell><PageHeading title="Nhận hàng" description="Ghi nhận từng dòng hàng cùng ảnh thực nhận và chứng từ giao hàng để chuyển sang kiểm tra chất lượng." />
    {model.setup.kind === "loading" && <LoadingState title="Đang tải phiếu nhập" />}
    {model.setup.kind === "error" && <ErrorState title={model.setup.message} onRetry={model.onReload} />}
    {model.setup.kind === "empty" && <EmptyState title="Không tìm thấy phiếu trong chi nhánh đang làm việc" />}
    {model.setup.kind === "ready" && <div className="mt-6 grid min-w-0 gap-4">
      <p>{model.setup.supplier} · {statuses[model.setup.receipt.status] ?? "Đang xử lý"}</p>
      <ReceiptDateInput value={toISODate(model.setup.receipt.expected_at)} onChange={() => {}} disabled />
      {!model.open && <p role="status">Phiếu không còn nhận thêm hàng. Tải lại để xem trạng thái mới.</p>}
      {!model.rows.length && <EmptyState title="Phiếu chưa có dòng nguyên liệu" />}
      {model.rows.map((row, index) => <ReceiptLine key={row.line.receipt_line_ref} row={row} model={model} previous={model.rows[index - 1]?.document?.file} />)}
      {model.compatible ? <p className="tabular-nums">Tổng dự kiến: {model.expected.toLocaleString("vi-VN", { maximumFractionDigits: 6 })} {model.unit} · Tổng đã nhận: {model.actual.toLocaleString("vi-VN", { maximumFractionDigits: 6 })} {model.unit}</p> : <InlineAlert>Phiếu có các đơn vị không thể cộng chung. Kiểm tra lại từng dòng.</InlineAlert>}
      {model.needsVariance && <QuantityVariance model={model} />}
    </div>}
  </PageShell>;
}
