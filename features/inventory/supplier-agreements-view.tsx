"use client";

import { Button } from "@/components/ui/button";
import { SupplierAgreementCard } from "./supplier-agreement-card";
import { useTranslations } from "next-intl";
import { EmptyState, ErrorState, LoadingState } from "@/components/patterns/empty-state";
import { Field } from "@/components/patterns/form-field";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { AgreementDocument } from "./agreement-document";
import { SupplierAgreementContainer } from "./supplier-agreement-container";

import { type useSupplierAgreements } from "./use-supplier-agreements";
import { TablePager } from "@/components/patterns/table-pager";
import { InlineAlert } from "@/components/patterns/inline-alert";

type SupplierAgreementsViewProps = ReturnType<typeof useSupplierAgreements>;


export function SupplierAgreementsView({ supplierId, supplierCode, suspended, can, read, items, materials, error, next, pages, setRevision, editor, setEditor, suspending, setSuspending, reason, setReason, busy, attachment, setAttachment, attach, suspend, download, actionError }: SupplierAgreementsViewProps) {
  const t = useTranslations("supplierAgreement");
  if (!read) return <ErrorState denied title="Bạn không có quyền xem hợp đồng" />;
  return <section className="mt-6 grid gap-4" aria-label="Bảng giá tham chiếu">
    <div><h2 className="text-xl font-semibold">Các bảng giá</h2><p className="text-muted-foreground">Giá tham chiếu để ước tính khi nhập hàng. Giá thật vẫn nhập ở phiếu nhập.</p></div>
    {error ? <ErrorState title={error} onRetry={() => setRevision(value => value + 1)} /> : items === undefined ? <LoadingState title="Đang tải bảng giá" /> : items.length === 0 ? <EmptyState title="Chưa có bảng giá" description={suspended ? t("suspendedHint") : "Thêm bảng giá để biết nhà cung cấp này bán gì, giá bao nhiêu."} /> : items.map(agreement => <SupplierAgreementCard key={agreement.agreement_id} agreement={agreement} materials={materials} canUpdate={can("inventory:supplier:update")} busy={busy}
      onOpenDraft={() => setEditor({ kind: "draft", agreement })} onSuspend={() => { setReason(""); setSuspending(agreement); }} onAttach={() => setAttachment({ agreement, file: null, key: crypto.randomUUID() })} onDownload={ref => void download(ref)} />)}
    {(pages.hasPrevious || next) && <TablePager label="Phân trang bảng giá" className="pt-0" busy={items === undefined} status={`Trang ${pages.page}`} hasPrevious={pages.hasPrevious} onPrevious={pages.previous} hasNext={Boolean(next)} onNext={() => pages.next(next)} />}
    {editor.kind !== "closed" && <SupplierAgreementContainer supplierId={supplierId} supplierCode={supplierCode} agreement={editor.kind === "draft" ? editor.agreement : undefined} onClose={() => setEditor({ kind: "closed" })} onSaved={() => { setEditor({ kind: "closed" }); setRevision(value => value + 1); }} onConflict={() => setRevision(value => value + 1)} />}
    <Dialog open={attachment !== null} onOpenChange={open => { if (!open && !busy) setAttachment(null); }}><DialogContent><DialogTitle>Gắn chứng từ</DialogTitle><DialogDescription>Thêm hợp đồng hoặc báo giá cho bảng giá đang áp dụng. Giá và ngày áp dụng giữ nguyên.</DialogDescription>
      <AgreementDocument supplierId={supplierId} file={attachment?.file} disabled={busy} onSelect={file => setAttachment(current => current ? { agreement: current.agreement, file, key: crypto.randomUUID() } : null)} />
      {actionError && <InlineAlert>{actionError}</InlineAlert>}
      <DialogFooter><Button variant="outline" disabled={busy} onClick={() => setAttachment(null)}>Huỷ</Button><Button disabled={busy || !attachment?.file} onClick={attach}>{busy ? "Đang gắn…" : "Lưu chứng từ"}</Button></DialogFooter>
    </DialogContent></Dialog>
    <Dialog open={suspending !== null} onOpenChange={open => { if (!open && !busy) setSuspending(null); }}><DialogContent><DialogTitle>Ngừng áp dụng {suspending?.code}</DialogTitle><DialogDescription>Phiếu nhập mới sẽ không dùng bảng giá này nữa. Phiếu đã tạo giữ nguyên giá. Bảng giá đã ngừng không áp dụng lại được.</DialogDescription>
      <Field label="Lý do ngừng áp dụng" htmlFor="agreement-suspend-reason"><Textarea id="agreement-suspend-reason" required maxLength={500} value={reason} onChange={event => setReason(event.target.value)} /></Field>
      {actionError && <InlineAlert>{actionError}</InlineAlert>}
      <DialogFooter><Button variant="outline" disabled={busy} onClick={() => setSuspending(null)}>Huỷ</Button><Button variant="destructive" disabled={busy || !reason.trim()} onClick={suspend}>{busy ? "Đang lưu…" : "Ngừng áp dụng"}</Button></DialogFooter></DialogContent></Dialog>
  </section>;
}
