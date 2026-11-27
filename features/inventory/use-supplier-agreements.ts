"use client";

import { useEffect, useRef, useState } from "react";
import { useAccess } from "@/lib/access-boundary";
import { useCursorPages } from "@/lib/cursor-pages";
import { getAgreements, saveAgreementVersion, agreementInput, type Agreement } from "@/lib/api/supplier-agreements";
import { useContractMaterials } from "./use-contract-materials";
import { downloadDocument, presignDocument, uploadDocument, finalizeDocument, fileSHA256 } from "@/lib/api/agreement-documents";

import { attachAgreementDocument } from "@/lib/api/supplier-agreement-documents";
import { FetchError } from "@/lib/fetcher";
import { toast } from "@/components/ui/toast";

type Attachment = { agreement: Agreement; file: File | null; key: string; uploadId?: string; finalizeKey?: string; documentRef?: string };
type AgreementEditor = { kind: "closed" } | { kind: "new" } | { kind: "draft"; agreement: Agreement };
export type SupplierAgreementsOptions = { supplierId: string; supplierCode?: string; initialItems?: Agreement[]; startNew?: boolean; suspended?: boolean; onNewClosed?: () => void };
export function useSupplierAgreements({ supplierId, supplierCode, initialItems, startNew = false, suspended = false, onNewClosed }: SupplierAgreementsOptions) {
  const { can } = useAccess();
  const read = can("inventory:supplier:read");
  const [items, setItems] = useState(initialItems);
  const { materials: catalog, failed: catalogFailed } = useContractMaterials(read);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [next, setNext] = useState("");
  const pages = useCursorPages();
  const cursor = pages.cursor;
  const [revision, setRevision] = useState(0);
  const [editor, setEditorState] = useState<AgreementEditor>(startNew ? { kind: "new" } : { kind: "closed" });
  const setEditor = (value: AgreementEditor) => { setEditorState(value); if (value.kind === "closed" && editor.kind === "new") onNewClosed?.(); };
  const [suspending, setSuspending] = useState<Agreement | null>(null);
  const [reason, setReason] = useState("");
  const [attachment, setAttachment] = useState<Attachment | null>(null);
  const attaching = useRef(false);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (!read) return;
    let live = true;
    setError("");
    getAgreements(supplierId, cursor).then(page => { if (live) { setItems(page.items); setNext(page.next_cursor); setError(""); } }).catch(() => { if (live) setError("Không tải được bảng giá. Thử lại để tiếp tục."); });
    return () => { live = false; };
  }, [supplierId, read, revision, initialItems, cursor]);
  async function suspend() {
    if (!suspending || !reason.trim() || reason.trim().length > 500 || busy || !can("inventory:supplier:update")) return;
    setBusy(true); setActionError("");
    try { await saveAgreementVersion(supplierId, suspending.agreement_id, suspending.version, agreementInput(suspending, "SUSPENDED", reason.trim())); toast.success(`Đã ngừng áp dụng bảng giá ${suspending.code}`); setSuspending(null); setReason(""); setRevision(value => value + 1); }
    catch { setActionError("Không ngừng áp dụng được bảng giá. Đóng hộp thoại, tải lại trang để xem trạng thái mới nhất."); setRevision(value => value + 1); }
    finally { setBusy(false); }
  }
  async function attach() {
    if (!attachment?.file || busy || attaching.current || !can("inventory:supplier:update") || attachment.agreement.status !== "ACTIVE") return;
    attaching.current = true;
    setBusy(true); setActionError("");
    let current = attachment;
    try {
      if (!current.uploadId && !current.documentRef) {
        const target = await presignDocument(supplierId, attachment.file, await fileSHA256(attachment.file), current.key);
        await uploadDocument(target, attachment.file);
        current = { ...current, uploadId: target.upload_id, finalizeKey: crypto.randomUUID() };
        setAttachment(current);
      }
      if (!current.documentRef) {
        const document = await finalizeDocument(supplierId, current.uploadId!, current.finalizeKey);
        current = { ...current, documentRef: document.document_id };
        setAttachment(current);
      }
      await attachAgreementDocument(supplierId, current.agreement.agreement_id, current.documentRef!, current.key);
      toast.success(`Đã gắn chứng từ cho bảng giá ${current.agreement.code}`); setAttachment(null); setRevision(value => value + 1);
    } catch (cause) {
      if (cause instanceof FetchError && cause.status === 404) { setAttachment({ agreement: attachment.agreement, file: null, key: crypto.randomUUID() }); setActionError("Phiên tải hoặc bảng giá không còn tồn tại. Chọn lại tệp và thử lại."); }
      else if (cause instanceof FetchError && cause.status === 409) { setActionError("Bảng giá đã thay đổi hoặc đã có chứng từ. Tải lại để kiểm tra."); setRevision(value => value + 1); }
      else setActionError(cause instanceof Error ? cause.message : "Không gắn được chứng từ. Thử lại với cùng phiên tải.");
    } finally { attaching.current = false; setBusy(false); }
  }
  async function download(ref: string) {
    if (busy || !read) return;
    setBusy(true);
    try { window.open(await downloadDocument(supplierId, ref), "_blank", "noopener,noreferrer"); }
    catch { toast.error("Không tải được chứng từ. Kiểm tra quyền và thử lại."); }
    finally { setBusy(false); }
  }
  return { supplierId, supplierCode, suspended, can, read, items, materials: catalog ?? [], error: error || (catalogFailed ? "Không tải được tên nguyên liệu. Thử lại để tiếp tục." : ""), next, pages, setRevision, editor, setEditor, suspending, setSuspending, reason, setReason, busy, attachment, setAttachment, attach, suspend, download, actionError };
}
