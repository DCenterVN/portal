import { SupplierDetailContainer } from "@/features/inventory/supplier-detail-container";

export default async function SupplierPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ tab?: string }> }) {
  const { id } = await params;
  const { tab } = await searchParams;
  return <SupplierDetailContainer supplierId={id} initialTab={tab === "agreements" ? "agreements" : "overview"} />;
}
