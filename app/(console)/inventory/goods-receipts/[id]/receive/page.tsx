import { GoodsReceiptReceive } from "@/features/inventory/goods-receipt-receive";

export default async function ReceiveGoodsReceiptPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ supplier?: string }> }) {
  const [{ id }, { supplier }] = await Promise.all([params, searchParams]);
  return <GoodsReceiptReceive key={`${id}:${supplier ?? ""}`} receiptID={id} supplierID={supplier ?? ""} />;
}
