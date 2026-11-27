import { redirect } from "next/navigation";
import { SupplierPricesPage } from "@/features/inventory/supplier-profile-pages";
import { legacySupplierPath, type SupplierLegacyQuery } from "@/features/inventory/supplier-routes";

export const metadata = { title: "Chi tiết nhà cung cấp" };

export default async function SupplierPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<SupplierLegacyQuery> }) {
  const { id } = await params;
  const target = legacySupplierPath(id, await searchParams);
  if (target && target !== `/inventory/suppliers/${encodeURIComponent(id)}`) redirect(target);
  return <SupplierPricesPage />;
}
