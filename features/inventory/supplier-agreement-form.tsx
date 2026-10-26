"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Field, TextInput, Select } from "@/components/ui/field";
import { EntityPicker } from "@/components/ui/entity-picker";
import { Dialog, DialogContent, DialogTitle, DialogDescription, ConfirmDialog } from "@/components/ui/dialog";
import { ErrorState, EmptyState, Skeleton } from "@/components/ui/state";
import { useAccess } from "@/lib/access-boundary";
import { createAgreement, saveAgreementVersion, getContractMaterials, type Agreement, type AgreementInput, type AgreementLine } from "@/lib/api/supplier-agreements";
import { type ContractDocument, presignDocument, uploadDocument, finalizeDocument, fileSHA256 } from "@/lib/api/agreement-documents";
import { type Material } from "@/lib/api/sales";
import { FetchError } from "@/lib/fetcher";
import { AgreementDocument } from "./agreement-document";

type Attachment = { kind: "empty" } | { kind: "selected"; file: File; key: string } | { kind: "uploaded"; uploadId: string; key: string } | { kind: "finalized"; document: ContractDocument };
const todayVN = () => new Intl.DateTimeFormat("sv-SE", { timeZone: "Asia/Ho_Chi_Minh" }).format(new Date());
function blankLine(date: string): AgreementLine { return { sku_ref: "", uom: "", unit_price_vnd: 0, valid_from: date, valid_to: date, tax_treatment: "VAT_INCLUDED", delivery_treatment: "DELIVERED" }; }

export function SupplierAgreementForm({ supplierId, agreement, onClose, onSaved, onConflict }: { supplierId: string; agreement?: Agreement; onClose: () => void; onSaved: () => void; onConflict: () => void }) {
  const { can } = useAccess();
  const allowed = can("inventory:supplier:update") && (!agreement || agreement.status === "DRAFT");
  const [code, setCode] = useState(agreement?.code ?? "");
  const [from, setFrom] = useState(agreement?.valid_from ?? todayVN());
  const [to, setTo] = useState(agreement?.valid_to ?? todayVN());
  const [lines, setLines] = useState<AgreementLine[]>(agreement?.lines ?? [blankLine(todayVN())]);
  const [materials, setMaterials] = useState<Material[] | null>(null);
  const [lookupError, setLookupError] = useState(false);
  const [attachment, setAttachment] = useState<Attachment>({ kind: "empty" });
  const [busy, setBusy] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [discard, setDiscard] = useState(false);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  const command = useRef({ body: "", key: "" });
  const form = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (!allowed) return;
    let live = true;
    getContractMaterials().then(value => { if (live) { setMaterials(value); setLookupError(false); } }).catch(() => { if (live) setLookupError(true); });
    return () => { live = false; };
  }, [allowed, retry]);
  const valid = allowed && code.trim() && from <= to && materials !== null && !lookupError && lines.length > 0 && new Set(lines.map(line => `${line.sku_ref}:${line.uom}`)).size === lines.length && lines.every(line => materials.some(material => material.id === line.sku_ref && material.uom_code === line.uom && material.selectable) && Number.isSafeInteger(line.unit_price_vnd) && line.unit_price_vnd >= 0 && line.valid_from >= from && line.valid_to <= to && line.valid_from <= line.valid_to);
  const priceDirty = Boolean(agreement) && (from !== agreement?.valid_from || to !== agreement?.valid_to || JSON.stringify(lines) !== JSON.stringify(agreement?.lines));

  async function documentRef(): Promise<string | null | undefined> {
    if (attachment.kind === "finalized") return attachment.document.document_id;
    if (attachment.kind === "empty") return agreement?.document_ref;
    let uploaded = attachment;
    if (uploaded.kind === "selected") {
      const target = await presignDocument(supplierId, uploaded.file, await fileSHA256(uploaded.file), uploaded.key);
      await uploadDocument(target, uploaded.file);
      uploaded = { kind: "uploaded", uploadId: target.upload_id, key: crypto.randomUUID() };
      setAttachment(uploaded);
    }
    const document = await finalizeDocument(supplierId, uploaded.uploadId, uploaded.key);
    setAttachment({ kind: "finalized", document });
    return document.document_id;
  }
  async function save(status: "DRAFT" | "ACTIVE") {
    if (!valid || busy || !form.current?.reportValidity() || (status === "ACTIVE" && (!agreement || priceDirty))) return;
    setBusy(true); setError("");
    try {
      const ref = await documentRef();
      if (status === "ACTIVE" && !ref) { setError("Chọn chứng từ chính trước khi áp dụng."); return; }
      const input: AgreementInput = { code: code.trim(), status, valid_from: from, valid_to: to, document_ref: ref, dataset_mode: agreement?.lines[0]?.dataset_mode ?? "REAL", lines: lines.map(({ price_line_ref: _ref, dataset_mode: _mode, ...line }) => line) };
      const encoded = JSON.stringify(input);
      if (command.current.body !== encoded) command.current = { body: encoded, key: crypto.randomUUID() };
      if (agreement) await saveAgreementVersion(supplierId, agreement.agreement_id, agreement.version, input, command.current.key);
      else await createAgreement(supplierId, input, command.current.key);
      onSaved();
    } catch (cause) {
      if (cause instanceof FetchError && cause.status === 404) { setAttachment({ kind: "empty" }); setError("Phiên tải đã hết hạn hoặc không còn tồn tại. Hãy chọn và tải lại tệp."); }
      else if (cause instanceof FetchError && cause.status === 409) { setError("Hợp đồng đã thay đổi hoặc trùng kỳ. Dữ liệu nhập được giữ; đóng và mở lại phiên bản mới để tiếp tục."); onConflict(); }
      else setError(cause instanceof Error ? cause.message : "Không lưu được hợp đồng. Thử lại với cùng phiên tải.");
    } finally { setBusy(false); }
  }
  function updateLine(index: number, patch: Partial<AgreementLine>) { setDirty(true); setLines(items => items.map((line, i) => i === index ? { ...line, ...patch } : line)); }
  function submit(event: FormEvent) { event.preventDefault(); void save("DRAFT"); }
  return <>
    <Dialog open onOpenChange={open => { if (!open && !busy) { if (dirty) setDiscard(true); else onClose(); } }}><DialogContent size="xl" variant="sheet" className="max-h-dvh overflow-y-auto">
      <DialogTitle>{agreement ? "Sửa bản nháp hợp đồng" : "Lập hợp đồng mới"}</DialogTitle><DialogDescription>Giá VND nguyên, không quy đổi đơn vị. Sau áp dụng, nội dung và chứng từ được giữ nguyên.</DialogDescription>
      {!allowed ? <ErrorState denied title="Hợp đồng không còn cho phép sửa" /> : <form ref={form} onSubmit={submit} onChange={() => setDirty(true)} className="grid gap-4">
        <nav aria-label="Các bước hợp đồng" className="flex gap-3"><Button type="button" variant="outline" onClick={() => form.current?.querySelector<HTMLInputElement>("#agreement-code")?.focus()}>1. Nháp</Button><Button type="button" variant="outline" onClick={() => form.current?.querySelector<HTMLInputElement>("#agreement-file")?.focus()}>2. Chứng từ</Button><span>3. Áp dụng</span></nav>
        <Field label="Mã hợp đồng" htmlFor="agreement-code"><TextInput id="agreement-code" required value={code} disabled={Boolean(agreement) || busy} onChange={event => setCode(event.target.value)} autoFocus /></Field>
        <div className="grid gap-4 sm:grid-cols-2"><Field label="Hiệu lực từ" htmlFor="agreement-from"><TextInput id="agreement-from" type="date" required value={from} onChange={event => setFrom(event.target.value)} disabled={busy} /></Field><Field label="Hiệu lực đến" htmlFor="agreement-to"><TextInput id="agreement-to" type="date" required min={from} value={to} onChange={event => setTo(event.target.value)} disabled={busy} /></Field></div>
        {lookupError ? <ErrorState title="Không tải được danh mục nguyên liệu" onRetry={() => setRetry(value => value + 1)} /> : materials === null ? <Skeleton title="Đang tải nguyên liệu" /> : materials.length === 0 ? <EmptyState title="Chưa có nguyên liệu để lập hợp đồng" /> : null}
        {lines.map((line, index) => <fieldset key={index} disabled={busy} className="grid gap-3 rounded-lg border border-line p-4"><legend>Dòng giá {index + 1}</legend>
          <EntityPicker label="Nguyên liệu" name={`agreement-material-${index}`} serializeValue={false} items={materials?.filter(item => item.selectable) ?? []} status={lookupError ? "error" : materials === null ? "loading" : "ready"} getId={material => material.id} getLabel={material => material.name} getMeta={material => `${material.sku_code} · ${material.uom_code}`} value={line.sku_ref} onChange={id => { const material = materials?.find(item => item.id === id); updateLine(index, { sku_ref: id ?? "", uom: material?.uom_code ?? "" }); }} required />
          <p>Đơn vị: {line.uom || "Chọn nguyên liệu"}</p>
          <Field label="Giá VND / đơn vị" htmlFor={`agreement-price-${index}`}><TextInput id={`agreement-price-${index}`} name="unit_price_vnd" type="number" min="0" max={Number.MAX_SAFE_INTEGER} step="1" required value={line.unit_price_vnd} onChange={event => updateLine(index, { unit_price_vnd: Number(event.target.value) })} /></Field>
          <div className="grid gap-3 sm:grid-cols-2"><Field label="Dòng giá từ ngày" htmlFor={`line-from-${index}`}><TextInput id={`line-from-${index}`} type="date" min={from} max={to} required value={line.valid_from} onChange={event => updateLine(index, { valid_from: event.target.value })} /></Field><Field label="Dòng giá đến ngày" htmlFor={`line-to-${index}`}><TextInput id={`line-to-${index}`} type="date" min={line.valid_from} max={to} required value={line.valid_to} onChange={event => updateLine(index, { valid_to: event.target.value })} /></Field></div>
          <Field label="Thuế" htmlFor={`line-tax-${index}`}><Select id={`line-tax-${index}`} value={line.tax_treatment} onChange={event => updateLine(index, { tax_treatment: event.target.value })}><option value="VAT_INCLUDED">Đã gồm thuế</option><option value="VAT_EXCLUDED">Chưa gồm thuế</option></Select></Field>
          <Field label="Giao hàng" htmlFor={`line-delivery-${index}`}><Select id={`line-delivery-${index}`} value={line.delivery_treatment} onChange={event => updateLine(index, { delivery_treatment: event.target.value })}><option value="DELIVERED">Giao tận nơi</option><option value="PICKUP">Tự nhận hàng</option></Select></Field>
          <Button type="button" variant="outline" disabled={lines.length === 1} onClick={() => { setDirty(true); setLines(items => items.filter((_, i) => i !== index)); }}>Bỏ dòng giá {index + 1}</Button>
        </fieldset>)}
        <Button type="button" variant="outline" disabled={busy} onClick={() => { setDirty(true); setLines(items => [...items, { ...blankLine(from), valid_to: to }]); }}>Thêm dòng giá</Button>
        <AgreementDocument supplierId={supplierId} documentRef={attachment.kind === "finalized" ? attachment.document.document_id : agreement?.document_ref} filename={attachment.kind === "finalized" ? attachment.document.display_name : undefined} file={attachment.kind === "selected" ? attachment.file : null} disabled={busy} onSelect={file => { setDirty(true); setAttachment(file ? { kind: "selected", file, key: crypto.randomUUID() } : { kind: "empty" }); }} />
        {attachment.kind === "uploaded" && <p role="status">Tệp đã tải lên. Thử lại sẽ hoàn tất cùng phiên tải, không tải bytes lần nữa.</p>}
        {error && <p role="alert">{error}</p>}
        {!valid && <p>Nhập mã, ngày hợp lệ và chọn nguyên liệu/giá cho mọi dòng để lưu.</p>}
        {priceDirty && <p>Lưu nháp các thay đổi giá và hiệu lực trước khi áp dụng.</p>}
        <div className="flex flex-wrap gap-3"><Button type="button" variant="outline" disabled={busy} onClick={() => dirty ? setDiscard(true) : onClose()}>Huỷ</Button><Button type="submit" disabled={!valid || busy}>{busy ? "Đang lưu…" : "Lưu nháp"}</Button>{agreement && <Button type="button" variant="outline" disabled={!valid || busy || priceDirty} onClick={() => void save("ACTIVE")}>Áp dụng bảng giá</Button>}</div>
      </form>}
    </DialogContent></Dialog>
    <ConfirmDialog open={discard} onOpenChange={setDiscard} title="Bỏ thay đổi hợp đồng?" description="Bản nháp đang nhập chưa được lưu." confirmLabel="Bỏ thay đổi" onConfirm={onClose} />
  </>;
}
