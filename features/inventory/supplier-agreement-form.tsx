"use client";

import { Button } from "@/components/ui/button";
import { PageHeading } from "@/components/patterns/page-heading";
import { Field } from "@/components/patterns/form-field";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Input } from "@/components/ui/input";
import { DatePicker } from "@/components/ui/date-picker";
import { EntityPicker } from "@/components/patterns/entity-picker";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/patterns/confirm-dialog";
import { ErrorState, EmptyState } from "@/components/patterns/empty-state";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronRight } from "lucide-react";
import { uomLabel } from "@/lib/stock-transfer";
import { AgreementDocument } from "./agreement-document";

import { type useSupplierAgreement } from "./use-supplier-agreement";
import { InlineAlert } from "@/components/patterns/inline-alert";

type SupplierAgreementFormProps = ReturnType<typeof useSupplierAgreement> & { layout?: "sheet" | "page" };
export function SupplierAgreementForm({ layout = "sheet", draftNotice, supplierId, agreement, onClose, allowed, code, setCode, from, to, lines, setLines, materials, lookupError, retry, attachment, setAttachment, busy, dirty, setDirty, discard, setDiscard, error, form, valid, priceDirty, save, updateLine, submit, changeFrom, changeTo }: SupplierAgreementFormProps) {
  const title = agreement ? "Sửa bản nháp bảng giá" : "Thêm giá nguyên liệu";
  const hint = "Giá tham chiếu, giá thật nhập ở phiếu nhập.";
  const body = <>
      {!allowed ? <ErrorState denied title="Bảng giá không còn cho phép sửa" /> : <form ref={form} onSubmit={submit} onChange={() => setDirty(true)} className="grid gap-4">
        {draftNotice && <p role="status">{draftNotice}</p>}
        <div className="grid gap-4 sm:grid-cols-3"><Field label="Mã bảng giá" htmlFor="agreement-code"><Input id="agreement-code" required value={code} disabled={Boolean(agreement) || busy} onChange={event => setCode(event.target.value)} autoFocus /></Field>
          <Field label="Áp dụng từ ngày" htmlFor="agreement-from"><DatePicker id="agreement-from" value={from} onChange={changeFrom} disabled={busy} /></Field><Field label="Áp dụng đến ngày" htmlFor="agreement-to" hint={to ? undefined : "Chọn ngày kết thúc áp dụng."}><DatePicker id="agreement-to" min={from} value={to} onChange={changeTo} disabled={busy} /></Field></div>
        {lookupError ? <ErrorState title="Không tải được danh mục nguyên liệu" onRetry={retry} /> : materials === null ? null : materials.length === 0 ? <EmptyState title="Chưa có nguyên liệu để lập bảng giá" /> : null}
        <div className="grid gap-3" aria-label="Các dòng bảng giá">
        {lines.map((line, index) => <fieldset key={index} disabled={busy} className="grid gap-3 rounded-lg border border-border p-3">
          <div className="grid items-start gap-3 sm:grid-cols-[minmax(0,1fr)_14rem]">
            <EntityPicker label="Nguyên liệu" name={`agreement-material-${index}`} serializeValue={false} className="w-full" placeholder="Chọn nguyên liệu" items={materials?.filter(item => item.selectable) ?? []} status={lookupError ? "error" : materials === null ? "loading" : "ready"} getId={material => material.id} getLabel={material => material.name} getMeta={material => `Đơn vị ${material.uom_code}`} value={line.sku_ref} onChange={id => { const material = materials?.find(item => item.id === id); updateLine(index, { sku_ref: id ?? "", uom: material?.uom_code ?? "" }); }} required />
            <Field label={line.uom ? `Giá (₫ mỗi ${uomLabel(line.uom)})` : "Giá (₫)"} htmlFor={`agreement-price-${index}`}><Input id={`agreement-price-${index}`} name="unit_price_vnd" type="text" inputMode="numeric" required value={Number.isNaN(line.unit_price_vnd) ? "" : line.unit_price_vnd.toLocaleString("vi-VN")} onChange={event => { const digits = event.target.value.replace(/\D/g, ""); updateLine(index, { unit_price_vnd: digits === "" ? Number.NaN : Number(digits) }); }} /></Field>
          </div>
          <Collapsible><CollapsibleTrigger className="flex items-center gap-1 text-sm text-muted-foreground [&[data-state=open]>svg]:rotate-90"><ChevronRight aria-hidden="true" className="size-4 transition-transform" />Ngày áp dụng riêng, thuế và giao hàng</CollapsibleTrigger><CollapsibleContent><div className="mt-3 grid gap-3 sm:grid-cols-4"><Field label="Từ ngày" htmlFor={`line-from-${index}`}><DatePicker id={`line-from-${index}`} min={from} max={to} value={line.valid_from} onChange={value => updateLine(index, { valid_from: value })} /></Field><Field label="Đến ngày" htmlFor={`line-to-${index}`}><DatePicker id={`line-to-${index}`} min={line.valid_from} max={to} value={line.valid_to} onChange={value => updateLine(index, { valid_to: value })} /></Field>
          <Field label="Thuế" htmlFor={`line-tax-${index}`}><NativeSelect id={`line-tax-${index}`} value={line.tax_treatment} onChange={event => updateLine(index, { tax_treatment: event.target.value })}><NativeSelectOption value="VAT_INCLUDED">Đã gồm thuế</NativeSelectOption><NativeSelectOption value="VAT_EXCLUDED">Chưa gồm thuế</NativeSelectOption></NativeSelect></Field>
          <Field label="Giao hàng" htmlFor={`line-delivery-${index}`}><NativeSelect id={`line-delivery-${index}`} value={line.delivery_treatment} onChange={event => updateLine(index, { delivery_treatment: event.target.value })}><NativeSelectOption value="DELIVERED">Giao tận nơi</NativeSelectOption><NativeSelectOption value="PICKUP">Tự nhận hàng</NativeSelectOption></NativeSelect></Field></div></CollapsibleContent></Collapsible>
          {lines.length > 1 && <div className="flex justify-end"><Button type="button" size="sm" variant="ghost" onClick={() => { setDirty(true); setLines(items => items.filter((_, i) => i !== index)); }}>Bỏ dòng này</Button></div>}
        </fieldset>)}
        </div>
        <div><Button type="button" size="sm" variant="outline" disabled={busy} onClick={() => { setDirty(true); setLines(items => [...items, { sku_ref: "", uom: "", unit_price_vnd: Number.NaN, valid_from: from, valid_to: to, tax_treatment: "VAT_INCLUDED", delivery_treatment: "DELIVERED" }]); }}>Thêm nguyên liệu</Button></div>
        <AgreementDocument supplierId={supplierId} documentRef={attachment.kind === "finalized" ? attachment.document.document_id : agreement?.primary_document_ref ?? agreement?.document_ref} filename={attachment.kind === "finalized" ? attachment.document.display_name : undefined} file={attachment.kind === "selected" ? attachment.file : null} disabled={busy} onSelect={file => { setDirty(true); setAttachment(file ? { kind: "selected", file, key: crypto.randomUUID() } : { kind: "empty" }); }} />
        {attachment.kind === "uploaded" && <p role="status">Tệp đã tải lên. Bấm lưu lại để hoàn tất, không phải tải lại tệp.</p>}
        {error && <InlineAlert>{error}</InlineAlert>}
        {!valid && <p className="text-sm text-muted-foreground">Nhập mã, ngày hợp lệ và chọn nguyên liệu, giá cho mọi dòng để lưu.</p>}
        {priceDirty && <p className="text-sm text-muted-foreground">Lưu nháp các thay đổi giá và ngày áp dụng trước khi áp dụng.</p>}
        {!agreement && <p className="text-sm text-muted-foreground">Lưu nháp trước, sau đó mới áp dụng bảng giá được.</p>}
        <div className="flex flex-col-reverse gap-2 bg-background pt-2 sm:sticky sm:bottom-0 sm:flex-row sm:justify-end"><Button type="button" variant="outline" disabled={busy} onClick={() => dirty ? setDiscard(true) : onClose()}>Huỷ</Button><Button type="submit" variant={agreement && !dirty ? "outline" : "default"} disabled={!valid || busy}>{busy ? "Đang lưu…" : "Lưu nháp"}</Button><Button type="button" variant={agreement && !dirty ? "default" : "outline"} disabled={!agreement || !valid || busy || priceDirty || dirty} onClick={() => void save("ACTIVE")}>Áp dụng bảng giá</Button></div>
      </form>}
  </>;
  return <>
    {layout === "page" ? <section className="mt-6 grid gap-4" aria-label={title}><PageHeading title={title} description={hint} />{body}</section>
      : <Dialog open onOpenChange={open => { if (!open && !busy) { if (dirty) setDiscard(true); else onClose(); } }}><DialogContent className="max-h-dvh overflow-y-auto sm:max-w-screen-lg">
        <DialogTitle>{title}</DialogTitle><DialogDescription>{hint}</DialogDescription>{body}</DialogContent></Dialog>}
    <ConfirmDialog open={discard} onOpenChange={setDiscard} title="Bỏ thay đổi bảng giá?" description="Bản nháp đang nhập chưa được lưu." confirmLabel="Bỏ thay đổi" onConfirm={onClose} />
  </>;
}
