import { TransferDetail } from "@/features/inventory/transfers/transfer-detail";

export const metadata = { title: "Chi tiết phiếu chuyển hàng" };

export default async function StockTransferPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <TransferDetail key={id} id={id} />;
}
