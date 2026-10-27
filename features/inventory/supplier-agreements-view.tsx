"use client";

import { Button } from "@/components/ui/button";
import { Table, TableHeader, TableHead, TableBody, TableRow, TableCell } from "@/components/ui/table";
import { EmptyState, ErrorState, Skeleton } from "@/components/ui/state";
import { Field, Textarea } from "@/components/ui/field";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { AgreementDocument } from "./agreement-document";
import { SupplierAgreementContainer } from "./supplier-agreement-container";

import { type useSupplierAgreements } from "./use-supplier-agreements";

type SupplierAgreementsViewProps = ReturnType<typeof useSupplierAgreements>;
const displayDate = (value: string) => value.split("-").reverse().join("/");

export function SupplierAgreementsView({ supplierId, can, read, items, materials, error, cursor, setRevision, editor, setEditor, suspending, setSuspending, reason, setReason, busy, attachment, setAttachment, attach, more, suspend, download }: SupplierAgreementsViewProps) {
  if (!read) return <ErrorState denied title="Bạn không có quyền xem hợp đồng" />;
  return <section className="mt-6 grid gap-4" aria-label="Bảng giá tham chiếu">
    <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-xl font-semibold">Bảng giá</h2><p>Giá tham chiếu khi nhập hàng. Bạn vẫn có thể nhập giá thực tế.</p></div>{can("inventory:supplier:update") && <Button onClick={() => setEditor({ kind: "new" })}>Lập bảng giá mới</Button>}</div>
    {error ? <ErrorState title={error} onRetry={() => setRevision(value => value + 1)} /> : items === undefined ? <Skeleton title="Đang tải bảng giá" /> : items.length === 0 ? <EmptyState title="Chưa có bảng giá tham chiếu" description="Lập bảng giá để tham khảo đơn giá khi nhập hàng." /> : items.map(agreement => <article key={agreement.agreement_id} className="grid gap-3 rounded-lg border border-line p-4">
      <h3 className="font-semibold">{agreement.code} · phiên bản {agreement.version}</h3>
      <p>{agreement.status === "SUSPENDED" ? "Đã ngừng dùng" : agreement.effective_status === "EXPIRED" ? "Hết hạn" : agreement.status === "ACTIVE" ? "Đã áp dụng" : "Nháp"} · {displayDate(agreement.valid_from)} đến {displayDate(agreement.valid_to)}</p>
      {agreement.status_reason && <p>Lý do: {agreement.status_reason}</p>}
      <Table><TableHeader><TableRow><TableHead>Nguyên liệu</TableHead><TableHead>Đơn vị</TableHead><TableHead>Giá VND</TableHead><TableHead>Hiệu lực</TableHead></TableRow></TableHeader><TableBody>{agreement.lines.map((line, index) => <TableRow key={index}><TableCell>{materials.find(material => material.id === line.sku_ref)?.name ?? "Chưa tải được tên nguyên liệu"}</TableCell><TableCell>{line.uom}</TableCell><TableCell className="text-right tabular-nums">{line.unit_price_vnd.toLocaleString("vi-VN")}</TableCell><TableCell>{displayDate(line.valid_from)} đến {displayDate(line.valid_to)}</TableCell></TableRow>)}</TableBody></Table>
      <div className="flex flex-wrap items-center gap-3"><span>{(agreement.primary_document_ref ?? agreement.document_ref) ? "Có chứng từ" : "Chưa có chứng từ"}</span>{(agreement.primary_document_ref ?? agreement.document_ref) && <Button variant="outline" disabled={busy} onClick={() => void download((agreement.primary_document_ref ?? agreement.document_ref)!)}>Tải chứng từ</Button>}</div>
      {can("inventory:supplier:update") && agreement.status === "ACTIVE" && !(agreement.primary_document_ref ?? agreement.document_ref) && <Button variant="outline" disabled={busy} onClick={() => setAttachment({ agreement, file: null, key: crypto.randomUUID() })}>Gắn chứng từ</Button>}
      {can("inventory:supplier:update") && agreement.status === "DRAFT" && <Button variant="outline" onClick={() => setEditor({ kind: "draft", agreement })}>Mở bản nháp</Button>}
      {can("inventory:supplier:update") && agreement.status === "ACTIVE" && agreement.effective_status !== "EXPIRED" && <Button variant="outline" onClick={() => { setReason(""); setSuspending(agreement); }}>Ngừng dùng</Button>}
    </article>)}
    {cursor && <Button variant="outline" disabled={busy} onClick={more}>Tải thêm bảng giá</Button>}
    {editor.kind !== "closed" && <SupplierAgreementContainer supplierId={supplierId} agreement={editor.kind === "draft" ? editor.agreement : undefined} onClose={() => setEditor({ kind: "closed" })} onSaved={() => { setEditor({ kind: "closed" }); setRevision(value => value + 1); }} onConflict={() => setRevision(value => value + 1)} />}
    <Dialog open={attachment !== null} onOpenChange={open => { if (!open && !busy) setAttachment(null); }}><DialogContent><DialogTitle>Gắn chứng từ</DialogTitle><DialogDescription>Bổ sung chứng từ cho bảng giá đã áp dụng. Giá, hiệu lực và phiên bản được giữ nguyên.</DialogDescription>
      <AgreementDocument supplierId={supplierId} file={attachment?.file} disabled={busy} onSelect={file => setAttachment(current => current ? { agreement: current.agreement, file, key: crypto.randomUUID() } : null)} />
      {error && <p role="alert">{error}</p>}
      <Button disabled={busy || !attachment?.file} onClick={attach}>{busy ? "Đang gắn…" : "Lưu chứng từ"}</Button>
    </DialogContent></Dialog>
    <Dialog open={suspending !== null} onOpenChange={open => { if (!open && !busy) setSuspending(null); }}><DialogContent><DialogTitle>Ngừng dùng {suspending?.code}</DialogTitle><DialogDescription>Phiếu mới không dùng bảng giá này. Nội dung và giá của phiếu cũ giữ nguyên.</DialogDescription><Field label="Lý do ngừng dùng" htmlFor="agreement-suspend-reason"><Textarea id="agreement-suspend-reason" required maxLength={500} value={reason} onChange={event => setReason(event.target.value)} /></Field><Button disabled={busy || !reason.trim()} onClick={suspend}>{busy ? "Đang lưu…" : "Xác nhận ngừng dùng"}</Button></DialogContent></Dialog>
  </section>;
}
