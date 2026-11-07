import { ReceiveTransfer } from "@/features/inventory/transfers/receive-transfer-form";

export default async function ReceiveStockTransferPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ReceiveTransfer key={id} id={id} />;
}
