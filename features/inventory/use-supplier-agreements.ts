"use client";

import { useEffect, useState } from "react";
import { useAccess } from "@/lib/access-boundary";
import { getAgreements, getContractMaterials, saveAgreementVersion, agreementInput, type Agreement } from "@/lib/api/supplier-agreements";
import { type Material } from "@/lib/api/sales";
import { downloadDocument } from "@/lib/api/agreement-documents";

type AgreementEditor = { kind: "closed" } | { kind: "new" } | { kind: "draft"; agreement: Agreement };
export type SupplierAgreementsOptions = { supplierId: string; initialItems?: Agreement[] };
export function useSupplierAgreements({ supplierId, initialItems }: SupplierAgreementsOptions) {
  const { can } = useAccess();
  const read = can("inventory:supplier:read");
  const [items, setItems] = useState(initialItems);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [error, setError] = useState("");
  const [cursor, setCursor] = useState("");
  const [revision, setRevision] = useState(0);
  const [editor, setEditor] = useState<AgreementEditor>({ kind: "closed" });
  const [suspending, setSuspending] = useState<Agreement | null>(null);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (!read) return;
    let live = true;
    setItems(initialItems); setCursor(""); setError(""); setMaterials([]);
    Promise.all([getAgreements(supplierId), getContractMaterials()]).then(([page, catalog]) => { if (live) { setItems(page.items); setCursor(page.next_cursor); setMaterials(catalog); setError(""); } }).catch(() => { if (live) setError("Không tải được bảng giá hoặc tên nguyên liệu. Thử lại để tiếp tục."); });
    return () => { live = false; };
  }, [supplierId, read, revision, initialItems]);
  useEffect(() => { setEditor({ kind: "closed" }); setSuspending(null); }, [supplierId]);
  async function more() {
    if (!cursor || busy) return;
    setBusy(true);
    try { const page = await getAgreements(supplierId, cursor); setItems(current => [...current ?? [], ...page.items]); setCursor(page.next_cursor); }
    catch { setError("Không tải được trang bảng giá tiếp theo"); }
    finally { setBusy(false); }
  }
  async function suspend() {
    if (!suspending || !reason.trim() || reason.trim().length > 500 || busy || !can("inventory:supplier:update")) return;
    setBusy(true);
    try { await saveAgreementVersion(supplierId, suspending.agreement_id, suspending.version, agreementInput(suspending, "SUSPENDED", reason.trim())); setSuspending(null); setReason(""); setRevision(value => value + 1); }
    catch { setError("Không ngừng được bảng giá. Tải lại để kiểm tra trạng thái mới nhất."); setRevision(value => value + 1); }
    finally { setBusy(false); }
  }
  async function download(ref: string) {
    if (busy || !read) return;
    setBusy(true);
    try { window.open(await downloadDocument(supplierId, ref), "_blank", "noopener,noreferrer"); }
    catch { setError("Không tải được chứng từ. Kiểm tra quyền và thử lại."); }
    finally { setBusy(false); }
  }
  return { supplierId, can, read, items, materials, error, cursor, setRevision, editor, setEditor, suspending, setSuspending, reason, setReason, busy, more, suspend, download };
}
