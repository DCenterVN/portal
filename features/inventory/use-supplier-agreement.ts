"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { useAccess } from "@/lib/access-boundary";
import { createAgreement, saveAgreementVersion, getContractMaterials, type Agreement, type AgreementInput, type AgreementLine } from "@/lib/api/supplier-agreements";
import { type ContractDocument, presignDocument, uploadDocument, finalizeDocument, fileSHA256 } from "@/lib/api/agreement-documents";
import { type Material } from "@/lib/api/sales";
import { useSupplierAgreementDraft, nextAgreementCommand } from "./use-supplier-agreement-draft";
import messages from "@/messages/vi.json";
import { FetchError } from "@/lib/fetcher";

type Attachment = { kind: "empty" } | { kind: "selected"; file: File; key: string } | { kind: "uploaded"; uploadId: string; key: string } | { kind: "finalized"; document: ContractDocument };
const todayVN = () => new Intl.DateTimeFormat("sv-SE", { timeZone: "Asia/Ho_Chi_Minh" }).format(new Date());
function blankLine(date: string): AgreementLine { return { sku_ref: "", uom: "", unit_price_vnd: Number.NaN, valid_from: date, valid_to: date, tax_treatment: "VAT_INCLUDED", delivery_treatment: "DELIVERED" }; }

export type SupplierAgreementOptions = { supplierId: string; agreement?: Agreement; onClose: () => void; onSaved: () => void; onConflict: () => void };
export function useSupplierAgreement({ supplierId, agreement, onClose, onSaved, onConflict }: SupplierAgreementOptions) {
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
  const submitting = useRef(false);
  const command = useRef({ body: "", key: "" });
  const form = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (!allowed) return;
    let live = true;
    getContractMaterials().then(value => { if (live) { setMaterials(value); setLookupError(false); } }).catch(() => { if (live) setLookupError(true); });
    return () => { live = false; };
  }, [allowed, retry]);
  const valid = allowed && code.trim() && from <= to && materials !== null && !lookupError && lines.length > 0 && new Set(lines.map(line => `${line.sku_ref}:${line.uom}`)).size === lines.length && lines.every(line => materials.some(material => material.id === line.sku_ref && material.uom_code === line.uom && material.selectable) && Number.isSafeInteger(line.unit_price_vnd) && line.unit_price_vnd >= 0 && line.valid_from >= from && line.valid_to <= to && line.valid_from <= line.valid_to);
  const draft = useSupplierAgreementDraft({
    supplierId, agreementId: agreement?.agreement_id, baseVersion: agreement?.version ?? null, allowed, dirty,
    values: { code, from, to, lines, needsFile: attachment.kind !== "empty" },
    restore: value => { setCode(agreement?.code ?? value.code); setFrom(value.from); setTo(value.to); setLines(value.lines); setDirty(true); },
  });
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
    if (!valid || submitting.current || busy || !form.current?.reportValidity() || (status === "ACTIVE" && (!agreement || priceDirty || dirty))) return;
    submitting.current = true;
    setBusy(true); setError("");
    try {
      const ref = await documentRef();
      if (status === "ACTIVE" && !ref) { setError("Chọn chứng từ chính trước khi áp dụng."); return; }
      const input: AgreementInput = { code: code.trim(), status, valid_from: from, valid_to: to, document_ref: ref, dataset_mode: agreement?.lines[0]?.dataset_mode ?? "REAL", lines: lines.map(({ price_line_ref: _ref, dataset_mode: _mode, ...line }) => line) };
      const encoded = JSON.stringify(input);
      command.current = nextAgreementCommand(command.current, encoded);
      if (agreement) await saveAgreementVersion(supplierId, agreement.agreement_id, agreement.version, input, command.current.key);
      else await createAgreement(supplierId, input, command.current.key);
      draft.clear();
      onSaved();
    } catch (cause) {
      if (cause instanceof FetchError && cause.status === 404) { setAttachment({ kind: "empty" }); setError("Phiên tải đã hết hạn hoặc không còn tồn tại. Hãy chọn và tải lại tệp."); }
      else if (cause instanceof FetchError && cause.status === 409) { setError(messages.supplierAgreement.stale); onConflict(); }
      else setError(cause instanceof Error ? cause.message : "Không lưu được bảng giá. Thử lại với cùng phiên tải.");
    } finally { submitting.current = false; setBusy(false); }
  }
  function updateLine(index: number, patch: Partial<AgreementLine>) { setDirty(true); setLines(items => items.map((line, i) => i === index ? { ...line, ...patch } : line)); }
  function submit(event: FormEvent) { event.preventDefault(); void save("DRAFT"); }
  function changeFrom(value: string) {
    setLines(items => items.map(line => ({ ...line, valid_from: line.valid_from === from ? value : line.valid_from })));
    setFrom(value); setDirty(true);
  }
  function changeTo(value: string) {
    setLines(items => items.map(line => ({ ...line, valid_to: line.valid_to === to ? value : line.valid_to })));
    setTo(value); setDirty(true);
  }
  function close() { draft.clear(); onClose(); }
  return { draftNotice: draft.notice, supplierId, agreement, onClose: close, allowed, code, setCode, from, to, lines, setLines, materials, lookupError, attachment, setAttachment, busy, dirty, setDirty, discard, setDiscard, error, setRetry, form, valid, priceDirty, save, updateLine, submit, changeFrom, changeTo };
}
