"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/patterns/status-badge";
import { useSupplierCategories } from "./use-supplier-form";
import { PageShell } from "@/components/ui/page";
import { PageHeading } from "@/components/patterns/page-heading";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/patterns/form-field";
import { Textarea } from "@/components/ui/textarea";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { ConfirmDialog } from "@/components/patterns/confirm-dialog";
import { InlineAlert } from "@/components/patterns/inline-alert";
import { EmptyState, ErrorState, LoadingState } from "@/components/patterns/empty-state";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import type { Supplier } from "@/lib/api/suppliers";
import { SupplierProfileProvider } from "./supplier-profile-context";
import { supplierHref, type SupplierTab } from "./supplier-routes";
import { supplierReasonNoteRequired, supplierSuspendReasons } from "./supplier-suspend";

import { type useSupplierDetail } from "./use-supplier-detail";

type SupplierDetailViewProps = ReturnType<typeof useSupplierDetail> & { tab?: SupplierTab | null; label?: string; children?: ReactNode };
export function SupplierDetailView({ supplierId, can, read, supplier, tab = "agreements", label = "", error, notFound, setRevision, setSupplier, photoUrl, photoFailed, children, ...status }: SupplierDetailViewProps) {
  if (!read) return <ErrorState denied title="Bạn không có quyền xem nhà cung cấp" />;
  if (notFound) return <EmptyState title="Không tìm thấy nhà cung cấp" action={<Link href={supplierHref.list}>Quay lại nhà cung cấp</Link>} />;
  if (!supplier) return error ? <ErrorState title={error} onRetry={() => setRevision(value => value + 1)} /> : <LoadingState title="Đang tải hồ sơ nhà cung cấp" />;
  const canUpdate = can("inventory:supplier:update");
  const active = supplier.status === "ACTIVE";
  const reload = () => setRevision(value => value + 1);
  return <SupplierProfileProvider value={{ supplier, photoUrl, canUpdate, reload, setSupplier }}><PageShell>
    <Breadcrumb className="mb-2"><BreadcrumbList>
      <BreadcrumbItem><BreadcrumbLink asChild><Link href={supplierHref.list}>Nhà cung cấp</Link></BreadcrumbLink></BreadcrumbItem><BreadcrumbSeparator />
      <BreadcrumbItem>{label && label !== "Nguyên liệu và giá" ? <BreadcrumbLink asChild><Link href={supplierHref.tab(supplierId, "agreements")}>{supplier.name}</Link></BreadcrumbLink> : <BreadcrumbPage>{supplier.name}</BreadcrumbPage>}</BreadcrumbItem>
      {label && label !== "Nguyên liệu và giá" && <><BreadcrumbSeparator /><BreadcrumbItem><BreadcrumbPage>{label}</BreadcrumbPage></BreadcrumbItem></>}
    </BreadcrumbList></Breadcrumb>
    <PageHeading icon={<SupplierPhoto name={supplier.name} url={photoUrl} onError={photoFailed} />} title={supplier.name} description={supplier.code} className="min-w-0 flex-1" badge={active ? undefined : <SupplierStatusBadge status={supplier.status} />} actions={(canUpdate || (active && can("inventory:goods_receipt:create"))) && <>
      {active && can("inventory:goods_receipt:create") && <Button asChild variant="outline"><Link href={supplierHref.receive(supplierId)}>Nhập hàng từ nhà này</Link></Button>}
      {canUpdate && <>
      <Button asChild variant="outline"><Link href={supplierHref.edit(supplierId)}>Sửa thông tin</Link></Button>
      {active && <Button asChild><Link href={supplierHref.newPrice(supplierId)}>Thêm giá nguyên liệu</Link></Button>}
      <Button variant={active ? "outline" : "default"} onClick={() => status.setChangeStatus(true)}>{active ? "Ngừng hợp tác" : "Hợp tác lại"}</Button></>}</>} />
    <SupplierSummary supplier={supplier} />
    {error && <ErrorState title={error} onRetry={reload} />}
    <Tabs value={tab ?? ""}>
      <TabsList aria-label="Hồ sơ nhà cung cấp">
        <TabsTrigger value="agreements" asChild><Link href={supplierHref.tab(supplierId, "agreements")}>Nguyên liệu và giá</Link></TabsTrigger>
        <TabsTrigger value="receipts" asChild><Link href={supplierHref.tab(supplierId, "receipts")}>Lịch sử nhập</Link></TabsTrigger>
        <TabsTrigger value="overview" asChild><Link href={supplierHref.tab(supplierId, "overview")}>Thông tin</Link></TabsTrigger>
      </TabsList>
    </Tabs>
    {children}
    <SupplierStatusDialog supplier={supplier} {...status} />
  </PageShell></SupplierProfileProvider>;
}

export function SupplierStatusBadge({ status }: { status: Supplier["status"] }) {
  return <StatusBadge tone={status === "ACTIVE" ? "neutral" : "warning"}>{status === "ACTIVE" ? "Đang hợp tác" : "Ngừng hợp tác"}</StatusBadge>;
}

export function SupplierContactLine({ supplier }: { supplier: Supplier }) {
  const { contact_name: name, contact_phone: phone } = supplier;
  if (!name && !phone) return null;
  return <>{name}{name && phone && " · "}{phone && <a className="underline-offset-4 hover:underline" href={`tel:${phone}`} onClick={event => event.stopPropagation()}>{phone}</a>}</>;
}

function SupplierSummary({ supplier }: { supplier: Supplier }) {
  const contact = Boolean(supplier.contact_name || supplier.contact_phone);
  const legacy = !supplier.material_category_codes?.length && (supplier.category_migration_required ?? supplier.material_categories.length > 0);
  if (!supplier.material_category_codes?.length && !legacy && !contact) return null;
  return <div className="mb-6 grid gap-2 text-sm">
    {legacy ? <p className="text-muted-foreground">Nhóm cũ cần chọn lại</p> : <SupplierCategoryChips codes={supplier.material_category_codes ?? []} />}
    {contact && <p className="text-muted-foreground">Liên hệ: <SupplierContactLine supplier={supplier} /></p>}
  </div>;
}

type SupplierCategoryChipsProps = { codes: string[] };
function SupplierCategoryChips({ codes }: SupplierCategoryChipsProps) {
  const { categories } = useSupplierCategories(codes.length > 0);
  const names = categories?.flatMap(parent => parent.children.filter(child => codes.includes(child.code)).map(child => `${parent.name}: ${child.name}`)) ?? [];
  if (!names.length) return null;
  return <ul aria-label="Nhóm nguyên liệu" className="flex flex-wrap gap-1.5">{names.map(name => <li key={name}><Badge variant="secondary">{name}</Badge></li>)}</ul>;
}

export function SupplierInfo({ supplier }: { supplier: Supplier }) {
  const t = useTranslations("supplierForm");
  const address = supplier.address ? [supplier.address.line, supplier.address.ward, supplier.address.province].filter(value => value.trim()).join(", ") : "";
  const hasContact = Boolean(supplier.contact_name || supplier.contact_phone || supplier.contact_email);
  const legacy = supplier.category_migration_required ?? supplier.material_categories.length > 0;
  const missing = [
    !supplier.material_category_codes?.length && !legacy && "nhóm nguyên liệu", !supplier.tax_code && "mã số thuế", !address && "địa chỉ", !hasContact && "liên hệ",
  ].filter(Boolean);
  const rows = [
    supplier.tax_code && { label: "Mã số thuế", value: <p>{supplier.tax_code}</p> },
    address && { label: "Địa chỉ", value: <p>{address}</p> },
    supplier.contact_email && { label: t("email"), value: <p><a href={`mailto:${supplier.contact_email}`}>{supplier.contact_email}</a></p> },
    supplier.note && { label: "Ghi chú", value: <p className="whitespace-pre-wrap">{supplier.note}</p> },
  ].filter(Boolean) as { label: string; value: ReactNode }[];
  return <div className="mt-6 grid gap-4">
    {rows.length > 0 && <dl className="grid gap-4 sm:grid-cols-2">{rows.map(row => <div key={row.label} className="min-w-0 break-words"><dt className="mb-1 text-xs font-semibold text-muted-foreground">{row.label}</dt><dd className="space-y-1">{row.value}</dd></div>)}</dl>}
    {missing.length > 0 && <p className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">Chưa có: {missing.join(", ")}</p>}
  </div>;
}

type SupplierStatusDialogProps = Pick<SupplierDetailViewProps, "changeStatus" | "setChangeStatus" | "operation" | "reasonCode" | "setReasonCode" | "reasonReady" | "statusError" | "reason" | "setReason" | "busy" | "change"> & { supplier: Supplier };
export function SupplierStatusDialog({ supplier, changeStatus, setChangeStatus, operation, reasonCode, setReasonCode, reasonReady, statusError, reason, setReason, busy, change }: SupplierStatusDialogProps) {
  const suspend = operation === "SUSPEND";
  const noteRequired = supplierReasonNoteRequired(operation, reasonCode);
  return <ConfirmDialog open={changeStatus} onOpenChange={setChangeStatus} danger={suspend} busy={busy} confirmDisabled={!reasonReady} confirmLabel={suspend ? "Ngừng hợp tác" : "Hợp tác lại"} onConfirm={change}
    title={suspend ? `Ngừng hợp tác với ${supplier.name}?` : `Hợp tác lại với ${supplier.name}?`}
    description={suspend ? "Nhà cung cấp ngừng hợp tác chỉ còn để xem: không dùng cho phiếu nhập mới. Lịch sử vẫn được giữ." : "Nhà cung cấp trở lại trạng thái đang hợp tác và dùng được cho phiếu nhập mới."}>
    {suspend && <Field label="Lý do ngừng hợp tác" htmlFor="supplier-reason-code"><NativeSelect id="supplier-reason-code" value={reasonCode} onChange={event => setReasonCode(event.target.value)}>
      <NativeSelectOption value="">Chọn lý do</NativeSelectOption>{supplierSuspendReasons.map(item => <NativeSelectOption key={item.code} value={item.code}>{item.label}</NativeSelectOption>)}</NativeSelect></Field>}
    <Field label={noteRequired ? (suspend ? "Ghi rõ lý do" : "Lý do hợp tác lại") : "Ghi chú (không bắt buộc)"} htmlFor="supplier-reason"><Textarea id="supplier-reason" value={reason} onChange={event => setReason(event.target.value)} maxLength={500} /></Field>
    {statusError && <InlineAlert>{statusError}</InlineAlert>}
  </ConfirmDialog>;
}

type SupplierPhotoProps = { name: string; url: string; onError: () => void };
export function SupplierPhoto({ name, url, onError }: SupplierPhotoProps) {
  const t = useTranslations("supplierForm");
  if (url) return <img src={url} alt={t("photoAlt", { name })} onError={onError} className="size-9 shrink-0 rounded-lg object-cover" />;
  return <div role="img" aria-label={t("photoAlt", { name })} className="grid size-9 shrink-0 place-items-center rounded-lg bg-tint"><span className="text-xl font-semibold">{name.trim().slice(0, 1).toLocaleUpperCase("vi-VN")}</span></div>;
}
