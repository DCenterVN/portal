"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/state";
import { downloadDocument, validContractFile } from "@/lib/api/agreement-documents";

export function AgreementDocument({ supplierId, documentRef, filename, file, onSelect, disabled }: { supplierId: string; documentRef?: string | null; filename?: string; file?: File | null; onSelect?: (file: File | null) => void; disabled?: boolean }) {
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function download() {
    if (!documentRef || busy) return;
    setBusy(true); setError("");
    try { window.open(await downloadDocument(supplierId, documentRef), "_blank", "noopener,noreferrer"); }
    catch { setError("Không tải được chứng từ. Kiểm tra quyền và thử lại."); }
    finally { setBusy(false); }
  }
  return <section aria-label="Chứng từ hợp đồng" aria-busy={busy} className="grid gap-3 rounded-lg border border-line p-4">
    <h3 className="font-semibold">Chứng từ chính</h3>
    {file ? <p>{file.name} · {Math.ceil(file.size / 1024)} KiB</p> : documentRef ? <p>{filename || "Đã gắn chứng từ hợp đồng"}</p> : <EmptyState title="Chưa gắn chứng từ" description="Cần một chứng từ đã hoàn tất trước khi áp dụng bảng giá." />}
    {onSelect && <><label htmlFor="agreement-file">Chọn PDF hoặc ảnh, tối đa 5 MiB</label><input id="agreement-file" type="file" accept="application/pdf,image/jpeg,image/png,image/webp" disabled={disabled} onChange={event => {
      const next = event.target.files?.[0] ?? null;
      if (next && !validContractFile(next)) { setError("Chỉ nhận PDF, JPEG, PNG, WebP từ 1 byte đến 5 MiB"); event.target.value = ""; return; }
      setError(""); onSelect(next);
    }} />{file && <Button type="button" variant="outline" disabled={disabled} onClick={() => onSelect(null)}>Bỏ tệp đã chọn</Button>}<p className="text-sm text-fg-3">Chọn hoặc bỏ tệp chưa tải lên. Tệp chỉ được gửi khi lưu.</p></>}
    {documentRef && <Button type="button" variant="outline" disabled={busy || disabled} onClick={download}>{busy ? "Đang cấp quyền tải…" : "Tải chứng từ"}</Button>}
    {error && <p role="alert">{error}</p>}
  </section>;
}
