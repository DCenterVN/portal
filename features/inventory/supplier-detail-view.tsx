"use client";

import Link from "next/link";
import { PageShell, PageHeader } from "@/components/ui/page";
import { Button } from "@/components/ui/button";
import { Field, Textarea } from "@/components/ui/field";
import { EmptyState, ErrorState, Skeleton } from "@/components/ui/state";
import { Tabs } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { SupplierForm } from "./supplier-form";
import { SupplierAgreementsContainer } from "./supplier-agreements-container";

import { type useSupplierDetail } from "./use-supplier-detail";

type SupplierDetailViewProps = ReturnType<typeof useSupplierDetail>;
export function SupplierDetailView({ supplierId, can, read, supplier, tab, setTab, error, notFound, edit, setEdit, changeStatus, setChangeStatus, reason, setReason, busy, setRevision, setSupplier, change }: SupplierDetailViewProps) {
  if (!read) return <ErrorState denied title="Bạn không có quyền xem nhà cung cấp" />;
  if (notFound) return <EmptyState title="Không tìm thấy nhà cung cấp" action={<Link href="/inventory/suppliers">Quay lại nhà cung cấp</Link>} />;
  if (!supplier) return error ? <ErrorState title={error} onRetry={() => setRevision(value => value + 1)} /> : <Skeleton title="Đang tải hồ sơ nhà cung cấp" />;
  return <PageShell>
    <Link href="/inventory/suppliers">Nhà cung cấp</Link>
    <div className="flex items-center gap-4"><div role="img" aria-label={`Ảnh nhà cung cấp ${supplier.name}`} className="grid size-16 shrink-0 place-items-center rounded-lg bg-tint"><span className="text-xl font-semibold">{supplier.name.trim().slice(0, 1).toLocaleUpperCase("vi-VN")}</span></div><PageHeader title={supplier.name} description={`${supplier.code} · ${supplier.status === "ACTIVE" ? "Đang hợp tác" : "Đã ngừng hợp tác"}`} /></div>
    {error && <ErrorState title={error} onRetry={() => setRevision(value => value + 1)} />}
    <Tabs label="Hồ sơ nhà cung cấp" idPrefix="supplier-detail" items={[{ id: "overview", label: "Thông tin" }, { id: "agreements", label: "Bảng giá" }]} value={tab} onChange={setTab}>
      {tab === "agreements" ? <SupplierAgreementsContainer key={supplierId} supplierId={supplierId} /> : <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <dl><dt>Mã nhà cung cấp</dt><dd>{supplier.code}</dd></dl>
        <dl><dt>Mã số thuế</dt><dd>{supplier.tax_code || "Chưa cung cấp"}</dd></dl>
        <dl><dt>Nhóm nguyên liệu</dt><dd>{supplier.material_categories.length ? "Nhóm cũ cần chọn lại" : "Chưa chọn nhóm nguyên liệu"}</dd></dl>
        <dl><dt>Địa chỉ</dt><dd>{typeof supplier.address === "string" ? supplier.address : "Chưa cung cấp"}</dd></dl>
        <dl><dt>Liên hệ</dt><dd>Chưa có thông tin liên hệ</dd></dl>
        {can("inventory:supplier:update") && <div className="flex flex-wrap gap-3"><Button onClick={() => setEdit(true)}>Sửa thông tin</Button><Button variant="outline" onClick={() => setChangeStatus(true)}>{supplier.status === "ACTIVE" ? "Ngừng hợp tác" : "Khôi phục hợp tác"}</Button></div>}
      </div>}
    </Tabs>
    {edit && <SupplierForm supplier={supplier} onClose={() => setEdit(false)} onSaved={value => { setSupplier(value); setEdit(false); }} />}
    <Dialog open={changeStatus} onOpenChange={open => { if (!busy) setChangeStatus(open); }}><DialogContent><DialogTitle>Thay đổi hợp tác với {supplier.name}</DialogTitle><DialogDescription>Ngừng hợp tác sẽ chặn tạo phiếu mới. Lịch sử vẫn được giữ.</DialogDescription><Field label="Lý do" htmlFor="supplier-reason"><Textarea id="supplier-reason" value={reason} onChange={event => setReason(event.target.value)} maxLength={500} /></Field><Button onClick={change} disabled={busy || !reason.trim()}>{busy ? "Đang lưu…" : "Xác nhận thay đổi"}</Button></DialogContent></Dialog>
  </PageShell>;
}
