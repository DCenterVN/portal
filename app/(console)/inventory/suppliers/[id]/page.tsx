import { SupplierDetailView } from "@/features/inventory/supplier-detail-view";

export default async function SupplierPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ tab?: string }> }) {
  const { id } = await params;
  const { tab } = await searchParams;
  return <SupplierDetailView supplierId={id} initialTab={tab === "agreements" ? "agreements" : "overview"} />;
}
