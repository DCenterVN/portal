import { SupplierDetailContainer } from "@/features/inventory/supplier-detail-container";

export default async function SupplierPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ tab?: string; edit?: string }> }) {
  const { id } = await params;
  const { tab, edit } = await searchParams;
  return <SupplierDetailContainer supplierId={id} initialTab={tab === "agreements" || tab === "receipts" ? tab : "overview"} initialEdit={edit === "1"} />;
}
