"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { downloadDocument, validContractFile } from "@/lib/api/agreement-documents";
import { InlineAlert } from "@/components/patterns/inline-alert";

export function AgreementDocument({ supplierId, documentRef, filename, file, onSelect, disabled }: { supplierId: string; documentRef?: string | null; filename?: string; file?: File | null; onSelect?: (file: File | null) => void; disabled?: boolean }) {
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  async function download() {
    if (!documentRef || busy) return;
    setBusy(true); setError("");
    try { window.open(await downloadDocument(supplierId, documentRef), "_blank", "noopener,noreferrer"); }
    catch { setError("Không tải được chứng từ. Kiểm tra quyền và thử lại."); }
    finally { setBusy(false); }
  }
  return <section aria-label="Chứng từ hợp đồng" aria-busy={busy} className="grid gap-3 rounded-lg border border-border p-4">
    <div><h3 className="font-semibold">Chứng từ (không bắt buộc)</h3><p className="text-sm text-muted-foreground">Hợp đồng hoặc báo giá của nhà cung cấp. Có thể bổ sung sau.</p></div>
    {file ? <p>{file.name} · {Math.ceil(file.size / 1024)} KB</p> : documentRef ? <p>{filename || "Đã gắn chứng từ hợp đồng"}</p> : <p className="text-sm text-muted-foreground">Chưa gắn chứng từ.</p>}
    {onSelect && <div className="flex flex-wrap items-center gap-2"><input ref={input} id="agreement-file" aria-label="Chọn tệp chứng từ" className="sr-only" type="file" accept="application/pdf,image/jpeg,image/png,image/webp" disabled={disabled} onChange={event => {
      const next = event.target.files?.[0] ?? null;
      if (next && !validContractFile(next)) { setError("Chỉ nhận tệp PDF hoặc ảnh, tối đa 5 MB"); event.target.value = ""; return; }
      setError(""); onSelect(next);
    }} /><Button type="button" size="sm" variant="outline" disabled={disabled} onClick={() => input.current?.click()}>{file ? "Chọn tệp khác" : "Chọn tệp"}</Button>{file && <Button type="button" size="sm" variant="ghost" disabled={disabled} onClick={() => onSelect(null)}>Bỏ tệp</Button>}<span className="text-sm text-muted-foreground">PDF hoặc ảnh, tối đa 5 MB</span></div>}
    {documentRef && <Button type="button" size="sm" variant="outline" className="justify-self-start" disabled={busy || disabled} onClick={download}>{busy ? "Đang cấp quyền tải…" : "Tải chứng từ"}</Button>}
    {error && <InlineAlert>{error}</InlineAlert>}
  </section>;
}
