"use client";

import { useEffect, useState } from "react";
import { useAccess } from "@/lib/access-boundary";
import { getAgreements, getContractMaterials, saveAgreementVersion, agreementInput, type Agreement } from "@/lib/api/supplier-agreements";
import { type Material } from "@/lib/api/sales";
import { Button } from "@/components/ui/button";
import { Table, TableHeader, TableHead, TableBody, TableRow, TableCell } from "@/components/ui/table";
import { EmptyState, ErrorState, Skeleton } from "@/components/ui/state";
import { Field, Textarea } from "@/components/ui/field";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { SupplierAgreementForm } from "./supplier-agreement-form";
import { AgreementDocument } from "./agreement-document";

export function SupplierAgreementsView({ supplierId, initialItems }: { supplierId: string; initialItems?: Agreement[] }) {
  const { can } = useAccess();
  const read = can("inventory:supplier:read");
  const [items, setItems] = useState(initialItems);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [error, setError] = useState("");
  const [cursor, setCursor] = useState("");
  const [revision, setRevision] = useState(0);
  const [editor, setEditor] = useState<{ kind: "closed" } | { kind: "new" } | { kind: "draft"; agreement: Agreement }>({ kind: "closed" });
  const [suspending, setSuspending] = useState<Agreement | null>(null);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (!read) return;
    let live = true;
    Promise.all([getAgreements(supplierId), getContractMaterials()]).then(([page, catalog]) => { if (live) { setItems(page.items); setCursor(page.next_cursor); setMaterials(catalog); setError(""); } }).catch(() => { if (live) setError("Không tải được hợp đồng hoặc tên nguyên liệu. Thử lại để tiếp tục."); });
    return () => { live = false; };
  }, [supplierId, read, revision]);
  async function more() {
    if (!cursor || busy) return;
    setBusy(true);
    try { const page = await getAgreements(supplierId, cursor); setItems(current => [...current ?? [], ...page.items]); setCursor(page.next_cursor); }
    catch { setError("Không tải được trang hợp đồng tiếp theo"); }
    finally { setBusy(false); }
  }
  async function suspend() {
    if (!suspending || !reason.trim() || reason.trim().length > 500 || busy || !can("inventory:supplier:update")) return;
    setBusy(true);
    try { await saveAgreementVersion(supplierId, suspending.agreement_id, suspending.version, agreementInput(suspending, "SUSPENDED", reason.trim())); setSuspending(null); setReason(""); setRevision(value => value + 1); }
    catch { setError("Không ngừng được hợp đồng. Tải lại để kiểm tra trạng thái mới nhất."); setRevision(value => value + 1); }
    finally { setBusy(false); }
  }
  if (!read) return <ErrorState denied title="Bạn không có quyền xem hợp đồng" />;
  return <section className="mt-6 grid gap-4" aria-label="Hợp đồng nhà cung cấp">
    <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-xl font-semibold">Hợp đồng giá</h2><p>Nháp → chứng từ → áp dụng. Giá đã áp dụng được giữ nguyên.</p></div>{can("inventory:supplier:update") && <Button onClick={() => setEditor({ kind: "new" })}>Lập hợp đồng mới</Button>}</div>
    {error ? <ErrorState title={error} onRetry={() => setRevision(value => value + 1)} /> : items === undefined ? <Skeleton title="Đang tải hợp đồng" /> : items.length === 0 ? <EmptyState title="Chưa có hợp đồng" description="Lập bản nháp và gắn chứng từ trước khi áp dụng bảng giá." /> : items.map(agreement => <article key={agreement.agreement_id} className="grid gap-3 rounded-lg border border-line p-4">
      <h3 className="font-semibold">{agreement.code} · phiên bản {agreement.version}</h3>
      <p>{agreement.status === "SUSPENDED" ? "Đã ngừng dùng" : agreement.effective_status === "EXPIRED" ? "Đã hết hạn" : agreement.status === "ACTIVE" ? "Đã áp dụng" : "Bản nháp"} · {agreement.valid_from} đến {agreement.valid_to}</p>
      {agreement.status_reason && <p>Lý do: {agreement.status_reason}</p>}
      <Table><TableHeader><TableRow><TableHead>Nguyên liệu</TableHead><TableHead>Đơn vị</TableHead><TableHead>Giá VND</TableHead><TableHead>Hiệu lực</TableHead></TableRow></TableHeader><TableBody>{agreement.lines.map((line, index) => <TableRow key={index}><TableCell>{materials.find(material => material.id === line.sku_ref)?.name ?? "Chưa tải được tên nguyên liệu"}</TableCell><TableCell>{line.uom}</TableCell><TableCell className="text-right tabular-nums">{line.unit_price_vnd.toLocaleString("vi-VN")}</TableCell><TableCell>{line.valid_from} đến {line.valid_to}</TableCell></TableRow>)}</TableBody></Table>
      <AgreementDocument supplierId={supplierId} documentRef={agreement.document_ref} />
      {can("inventory:supplier:update") && agreement.status === "DRAFT" && <Button variant="outline" onClick={() => setEditor({ kind: "draft", agreement })}>Mở bản nháp</Button>}
      {can("inventory:supplier:update") && agreement.status === "ACTIVE" && agreement.effective_status !== "EXPIRED" && <Button variant="outline" onClick={() => { setReason(""); setSuspending(agreement); }}>Ngừng dùng</Button>}
    </article>)}
    {cursor && <Button variant="outline" disabled={busy} onClick={more}>Tải thêm hợp đồng</Button>}
    {editor.kind !== "closed" && <SupplierAgreementForm supplierId={supplierId} agreement={editor.kind === "draft" ? editor.agreement : undefined} onClose={() => setEditor({ kind: "closed" })} onSaved={() => { setEditor({ kind: "closed" }); setRevision(value => value + 1); }} onConflict={() => setRevision(value => value + 1)} />}
    <Dialog open={suspending !== null} onOpenChange={open => { if (!open && !busy) setSuspending(null); }}><DialogContent><DialogTitle>Ngừng dùng {suspending?.code}</DialogTitle><DialogDescription>Phiếu mới không dùng bảng giá này. Nội dung và giá của phiếu cũ giữ nguyên.</DialogDescription><Field label="Lý do ngừng dùng" htmlFor="agreement-suspend-reason"><Textarea id="agreement-suspend-reason" required maxLength={500} value={reason} onChange={event => setReason(event.target.value)} /></Field><Button disabled={busy || !reason.trim()} onClick={suspend}>{busy ? "Đang lưu…" : "Xác nhận ngừng dùng"}</Button></DialogContent></Dialog>
  </section>;
}
