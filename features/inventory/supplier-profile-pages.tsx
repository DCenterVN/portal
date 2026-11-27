"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/patterns/empty-state";
import { useAccess } from "@/lib/access-boundary";
import { SupplierInfo } from "./supplier-detail-view";
import { SupplierAgreementContainer } from "./supplier-agreement-container";
import { SupplierFormContainer } from "./supplier-form-container";
import { SupplierPricesTab } from "./supplier-prices-tab";
import { SupplierReceiptsContainer } from "./supplier-receipts-container";
import { useSupplierProfile } from "./supplier-profile-context";
import { supplierHref } from "./supplier-routes";

function NoRight({ title, href }: { title: string; href: string }) {
  return <EmptyState title={title} description="Liên hệ quản trị viên để được cấp quyền." action={<Button asChild variant="outline"><Link href={href as never}>Quay lại</Link></Button>} />;
}

export function SupplierPricesPage() {
  const { supplier, canUpdate } = useSupplierProfile();
  const { can } = useAccess();
  return <SupplierPricesTab supplier={supplier} canUpdate={canUpdate} read={can("inventory:supplier:read")} />;
}

export function SupplierNewPricePage() {
  const { supplier, canUpdate } = useSupplierProfile();
  const router = useRouter();
  const list = supplierHref.tab(supplier.id, "agreements");
  if (!canUpdate) return <NoRight title="Bạn không có quyền thêm bảng giá" href={list} />;
  return <SupplierAgreementContainer layout="page" supplierId={supplier.id} supplierCode={supplier.code} onClose={() => router.push(list)} onSaved={() => router.push(list)} onConflict={() => {}} />;
}

export function SupplierReceiptsPage() {
  return <SupplierReceiptsContainer supplierId={useSupplierProfile().supplier.id} />;
}

export function SupplierInfoPage() {
  return <SupplierInfo supplier={useSupplierProfile().supplier} />;
}

export function SupplierEditPage() {
  const { supplier, photoUrl, canUpdate, setSupplier } = useSupplierProfile();
  const router = useRouter();
  const info = supplierHref.tab(supplier.id, "overview");
  if (!canUpdate) return <NoRight title="Bạn không có quyền sửa nhà cung cấp" href={info} />;
  return <SupplierFormContainer layout="page" supplier={supplier} photoUrl={photoUrl} onClose={() => router.push(info)} onSaved={value => { setSupplier(value); router.push(info); }} />;
}

export function SupplierCreatePage() {
  const { can } = useAccess();
  const router = useRouter();
  if (!can("inventory:supplier:create")) return <NoRight title="Bạn không có quyền thêm nhà cung cấp" href={supplierHref.list} />;
  return <SupplierFormContainer layout="page" onClose={() => router.push(supplierHref.list)} onSaved={saved => router.push(supplierHref.tab(saved.id, "agreements"))} />;
}
