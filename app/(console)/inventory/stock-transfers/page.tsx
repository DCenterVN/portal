import { Suspense } from "react";
import { StockTransfersView } from "@/features/inventory/transfers/stock-transfers-view";

export const metadata = { title: "Chuyển hàng" };

export default function StockTransfersPage() {
  return <Suspense><StockTransfersView /></Suspense>;
}
