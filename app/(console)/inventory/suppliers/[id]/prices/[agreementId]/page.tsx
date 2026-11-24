import { SupplierPriceDetail } from "@/features/inventory/supplier-price-detail";

export default async function PricePage({ params }: { params: Promise<{ agreementId: string }> }) {
  const { agreementId } = await params;
  return <SupplierPriceDetail agreementId={agreementId} />;
}
