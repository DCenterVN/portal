"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { SupplierCategoryGroups } from "./supplier-category-picker";
import { useSupplierCategories } from "./use-supplier-form";
import { PageShell, PageHeader } from "@/components/ui/page";
import { Button } from "@/components/ui/button";
import { Field, Textarea } from "@/components/ui/field";
import { EmptyState, ErrorState, Skeleton } from "@/components/ui/state";
import { Tabs } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { SupplierFormContainer } from "./supplier-form-container";
import { SupplierAgreementsContainer } from "./supplier-agreements-container";
import { SupplierReceiptsContainer } from "./supplier-receipts-container";

import { type useSupplierDetail } from "./use-supplier-detail";

type SupplierDetailViewProps = ReturnType<typeof useSupplierDetail>;
export function SupplierDetailView({ supplierId, can, read, supplier, tab, setTab, error, notFound, edit, setEdit, changeStatus, setChangeStatus, reason, setReason, busy, setRevision, setSupplier, change, photoUrl, photoFailed }: SupplierDetailViewProps) {
  if (!read) return <ErrorState denied title="Bạn không có quyền xem nhà cung cấp" />;
  if (notFound) return <EmptyState title="Không tìm thấy nhà cung cấp" action={<Link href="/inventory/suppliers">Quay lại nhà cung cấp</Link>} />;
  if (!supplier) return error ? <ErrorState title={error} onRetry={() => setRevision(value => value + 1)} /> : <Skeleton title="Đang tải hồ sơ nhà cung cấp" />;
  return <PageShell>
    <Link href="/inventory/suppliers">Nhà cung cấp</Link>
    <PageHeader icon={<SupplierPhoto name={supplier.name} url={photoUrl} onError={photoFailed} />} title={supplier.name} description={[supplier.code, supplier.address?.province, supplier.tax_code].filter(Boolean).join(" · ")} className="min-w-0 flex-1" badge={<Badge variant={supplier.status === "ACTIVE" ? "active" : "suspended"}>{supplier.status === "ACTIVE" ? "Đang hợp tác" : "Đã ngừng hợp tác"}</Badge>} actions={can("inventory:supplier:update") && <><Button onClick={() => setEdit(true)}>Sửa thông tin</Button><Button variant="outline" onClick={() => setChangeStatus(true)}>{supplier.status === "ACTIVE" ? "Ngừng hợp tác" : "Khôi phục hợp tác"}</Button></>} />
    {error && <ErrorState title={error} onRetry={() => setRevision(value => value + 1)} />}
    <Tabs label="Hồ sơ nhà cung cấp" idPrefix="supplier-detail" items={[{ id: "overview", label: "Thông tin" }, { id: "agreements", label: "Bảng giá" }, { id: "receipts", label: "Lịch sử nhập" }]} value={tab} onChange={setTab}>
      {tab === "agreements" ? <SupplierAgreementsContainer key={supplierId} supplierId={supplierId} /> : tab === "receipts" ? <SupplierReceiptsContainer key={supplierId} supplierId={supplierId} /> : <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <dl className="rounded-lg border border-line p-4"><dt className="mb-2 text-xs font-semibold text-fg-3">Mã nhà cung cấp</dt><dd>{supplier.code}</dd></dl>
        <dl className="rounded-lg border border-line p-4"><dt className="mb-2 text-xs font-semibold text-fg-3">Mã số thuế</dt><dd>{supplier.tax_code || "Chưa cung cấp"}</dd></dl>
        <dl className="rounded-lg border border-line p-4"><dt className="mb-2 text-xs font-semibold text-fg-3">Nhóm nguyên liệu</dt><dd>{supplier.material_category_codes?.length ? <SupplierCategorySummary codes={supplier.material_category_codes} /> : (supplier.category_migration_required ?? supplier.material_categories.length > 0) ? "Nhóm cũ cần chọn lại" : "Chưa chọn nhóm nguyên liệu"}</dd></dl>
        <dl className="rounded-lg border border-line p-4"><dt className="mb-2 text-xs font-semibold text-fg-3">Địa chỉ</dt><dd>{supplier.address ? [supplier.address.line, supplier.address.ward, supplier.address.province].filter(value => value.trim()).join(", ") || "Chưa cung cấp" : "Chưa cung cấp"}</dd></dl>
        <dl className="rounded-lg border border-line p-4"><dt className="mb-2 text-xs font-semibold text-fg-3">Liên hệ</dt><dd className="space-y-1 break-words">
          {supplier.contact_name && <p>{supplier.contact_name}</p>}
          {supplier.contact_phone && <p><a href={`tel:${supplier.contact_phone}`}>{supplier.contact_phone}</a></p>}
          {supplier.contact_email && <p><a href={`mailto:${supplier.contact_email}`}>{supplier.contact_email}</a></p>}
          {!supplier.contact_name && !supplier.contact_phone && !supplier.contact_email && "Chưa có thông tin liên hệ"}
          {supplier.note && <p className="whitespace-pre-wrap">{supplier.note}</p>}
        </dd></dl>
      </div>}
    </Tabs>
    {edit && <SupplierFormContainer supplier={supplier} onClose={() => setEdit(false)} onSaved={value => { setSupplier(value); setEdit(false); }} />}
    <Dialog open={changeStatus} onOpenChange={open => { if (!busy) setChangeStatus(open); }}><DialogContent><DialogTitle>Thay đổi hợp tác với {supplier.name}</DialogTitle><DialogDescription>Ngừng hợp tác sẽ chặn tạo phiếu mới. Lịch sử vẫn được giữ.</DialogDescription><Field label="Lý do" htmlFor="supplier-reason"><Textarea id="supplier-reason" value={reason} onChange={event => setReason(event.target.value)} maxLength={500} /></Field><Button onClick={change} disabled={busy || !reason.trim()}>{busy ? "Đang lưu…" : "Xác nhận thay đổi"}</Button></DialogContent></Dialog>
  </PageShell>;
}

type SupplierPhotoProps = { name: string; url: string; onError: () => void };
export function SupplierPhoto({ name, url, onError }: SupplierPhotoProps) {
  const t = useTranslations("supplierForm");
  if (url) return <img src={url} alt={t("photoAlt", { name })} onError={onError} className="size-9 shrink-0 rounded-lg object-cover" />;
  return <div role="img" aria-label={t("photoAlt", { name })} className="grid size-9 shrink-0 place-items-center rounded-lg bg-tint"><span className="text-xl font-semibold">{name.trim().slice(0, 1).toLocaleUpperCase("vi-VN")}</span></div>;
}

type SupplierCategorySummaryProps = { codes: string[] };
function SupplierCategorySummary({ codes }: SupplierCategorySummaryProps) {
  const t = useTranslations("supplierForm");
  const { categories, lookupError, retry } = useSupplierCategories();
  if (lookupError) return <ErrorState title={t("loadError")} onRetry={retry} />;
  if (!categories) return <Skeleton title={t("loading")} />;
  if (!categories.length) return <EmptyState title={t("empty")} />;
  return <div aria-label="Nhóm nguyên liệu đã chọn"><SupplierCategoryGroups categories={categories} selected={codes} /></div>;
}
