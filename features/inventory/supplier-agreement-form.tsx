"use client";

import { Button } from "@/components/ui/button";
import { Field, TextInput, Select } from "@/components/ui/field";
import { Table, TableHeader, TableHead, TableBody, TableRow, TableCell } from "@/components/ui/table";
import { EntityPicker } from "@/components/ui/entity-picker";
import { Dialog, DialogContent, DialogTitle, DialogDescription, ConfirmDialog } from "@/components/ui/dialog";
import { ErrorState, EmptyState, Skeleton } from "@/components/ui/state";
import { AgreementDocument } from "./agreement-document";

import { type useSupplierAgreement } from "./use-supplier-agreement";

type SupplierAgreementFormProps = ReturnType<typeof useSupplierAgreement>;
export function SupplierAgreementForm({ draftNotice, supplierId, agreement, onClose, allowed, code, setCode, from, to, lines, setLines, materials, lookupError, attachment, setAttachment, busy, dirty, setDirty, discard, setDiscard, error, setRetry, form, valid, priceDirty, save, updateLine, submit, changeFrom, changeTo }: SupplierAgreementFormProps) {
  return <>
    <Dialog open onOpenChange={open => { if (!open && !busy) { if (dirty) setDiscard(true); else onClose(); } }}><DialogContent size={lines.length > 1 ? "full" : "xl"} variant="sheet" className="max-h-dvh overflow-y-auto sm:max-w-screen-lg">
      <DialogTitle>{agreement ? "Sửa bản nháp bảng giá" : "Lập bảng giá mới"}</DialogTitle><DialogDescription>Giá VND nguyên, không quy đổi đơn vị. Sau áp dụng, giá và hiệu lực được giữ nguyên. Chứng từ có thể bổ sung sau.</DialogDescription>
      {!allowed ? <ErrorState denied title="Bảng giá không còn cho phép sửa" /> : <form ref={form} onSubmit={submit} onChange={() => setDirty(true)} className="grid gap-4">
        <p role="status">{dirty ? "Chưa lưu lên hệ thống" : agreement ? `Đã lưu nháp phiên bản ${agreement.version}` : "Chưa lưu lên hệ thống"}</p>
        {draftNotice && <p role="status">{draftNotice}</p>}
        <Field label="Mã bảng giá" htmlFor="agreement-code"><TextInput id="agreement-code" required value={code} disabled={Boolean(agreement) || busy} onChange={event => setCode(event.target.value)} autoFocus /></Field>
        <div className="grid gap-4 sm:grid-cols-2"><Field label="Hiệu lực từ" htmlFor="agreement-from"><TextInput id="agreement-from" type="date" required value={from} onChange={event => changeFrom(event.target.value)} disabled={busy} /></Field><Field label="Hiệu lực đến" htmlFor="agreement-to"><TextInput id="agreement-to" type="date" required min={from} value={to} onChange={event => changeTo(event.target.value)} disabled={busy} /></Field></div>
        {lookupError ? <ErrorState title="Không tải được danh mục nguyên liệu" onRetry={() => setRetry(value => value + 1)} /> : materials === null ? <Skeleton title="Đang tải nguyên liệu" /> : materials.length === 0 ? <EmptyState title="Chưa có nguyên liệu để lập bảng giá" /> : null}
        <Table aria-label="Các dòng bảng giá"><TableHeader><TableRow><TableHead>Nguyên liệu</TableHead><TableHead>Đơn vị</TableHead><TableHead>Giá VND / đơn vị</TableHead><TableHead>Hiệu lực và thao tác</TableHead></TableRow></TableHeader><TableBody>
        {lines.map((line, index) => <TableRow key={index}><TableCell><fieldset disabled={busy}>
          <EntityPicker label="Nguyên liệu" name={`agreement-material-${index}`} serializeValue={false} items={materials?.filter(item => item.selectable) ?? []} status={lookupError ? "error" : materials === null ? "loading" : "ready"} getId={material => material.id} getLabel={material => material.name} getMeta={material => `${material.sku_code} · ${material.uom_code}`} value={line.sku_ref} onChange={id => { const material = materials?.find(item => item.id === id); updateLine(index, { sku_ref: id ?? "", uom: material?.uom_code ?? "" }); }} required />
          </fieldset></TableCell><TableCell><p>Đơn vị: {line.uom || "Chọn nguyên liệu"}</p></TableCell><TableCell><fieldset disabled={busy}>
          <Field label="Giá VND / đơn vị" htmlFor={`agreement-price-${index}`}><TextInput id={`agreement-price-${index}`} name="unit_price_vnd" type="number" min="0" max={Number.MAX_SAFE_INTEGER} step="1" required value={Number.isNaN(line.unit_price_vnd) ? "" : line.unit_price_vnd} onChange={event => updateLine(index, { unit_price_vnd: event.target.value === "" ? Number.NaN : Number(event.target.value) })} /></Field>
          </fieldset></TableCell><TableCell><fieldset disabled={busy}><details><summary>Hiệu lực riêng, thuế và giao hàng</summary><div className="grid gap-3 sm:grid-cols-2"><Field label="Dòng giá từ ngày" htmlFor={`line-from-${index}`}><TextInput id={`line-from-${index}`} type="date" min={from} max={to} required value={line.valid_from} onChange={event => updateLine(index, { valid_from: event.target.value })} /></Field><Field label="Dòng giá đến ngày" htmlFor={`line-to-${index}`}><TextInput id={`line-to-${index}`} type="date" min={line.valid_from} max={to} required value={line.valid_to} onChange={event => updateLine(index, { valid_to: event.target.value })} /></Field></div>
          <Field label="Thuế" htmlFor={`line-tax-${index}`}><Select id={`line-tax-${index}`} value={line.tax_treatment} onChange={event => updateLine(index, { tax_treatment: event.target.value })}><option value="VAT_INCLUDED">Đã gồm thuế</option><option value="VAT_EXCLUDED">Chưa gồm thuế</option></Select></Field>
          <Field label="Giao hàng" htmlFor={`line-delivery-${index}`}><Select id={`line-delivery-${index}`} value={line.delivery_treatment} onChange={event => updateLine(index, { delivery_treatment: event.target.value })}><option value="DELIVERED">Giao tận nơi</option><option value="PICKUP">Tự nhận hàng</option></Select></Field>
          </details><Button type="button" variant="outline" disabled={lines.length === 1} onClick={() => { setDirty(true); setLines(items => items.filter((_, i) => i !== index)); }}>Bỏ dòng giá {index + 1}</Button>
        </fieldset></TableCell></TableRow>)}</TableBody></Table>
        <Button type="button" variant="outline" disabled={busy} onClick={() => { setDirty(true); setLines(items => [...items, { sku_ref: "", uom: "", unit_price_vnd: Number.NaN, valid_from: from, valid_to: to, tax_treatment: "VAT_INCLUDED", delivery_treatment: "DELIVERED" }]); }}>Thêm dòng giá</Button>
        <AgreementDocument supplierId={supplierId} documentRef={attachment.kind === "finalized" ? attachment.document.document_id : agreement?.primary_document_ref ?? agreement?.document_ref} filename={attachment.kind === "finalized" ? attachment.document.display_name : undefined} file={attachment.kind === "selected" ? attachment.file : null} disabled={busy} onSelect={file => { setDirty(true); setAttachment(file ? { kind: "selected", file, key: crypto.randomUUID() } : { kind: "empty" }); }} />
        {attachment.kind === "uploaded" && <p role="status">Tệp đã tải lên. Thử lại sẽ hoàn tất cùng phiên tải, không tải bytes lần nữa.</p>}
        {error && <p role="alert">{error}</p>}
        {!valid && <p>Nhập mã, ngày hợp lệ và chọn nguyên liệu/giá cho mọi dòng để lưu.</p>}
        {priceDirty && <p>Lưu nháp các thay đổi giá và hiệu lực trước khi áp dụng.</p>}
        <div className="grid gap-3"><Button type="button" variant="outline" disabled={busy} onClick={() => dirty ? setDiscard(true) : onClose()}>Huỷ</Button><Button type="submit" variant={agreement && !dirty ? "outline" : "primary"} disabled={!valid || busy}>{busy ? "Đang lưu…" : "Lưu nháp"}</Button>{agreement && <Button type="button" variant={dirty ? "outline" : "primary"} disabled={!valid || busy || priceDirty || dirty} onClick={() => void save("ACTIVE")}>Áp dụng bảng giá</Button>}</div>
      </form>}
    </DialogContent></Dialog>
    <ConfirmDialog open={discard} onOpenChange={setDiscard} title="Bỏ thay đổi bảng giá?" description="Bản nháp đang nhập chưa được lưu." confirmLabel="Bỏ thay đổi" onConfirm={onClose} />
  </>;
}
