import { Suspense } from "react";
import { StockOverviewContainer } from "@/features/inventory/stock/stock-overview-container";

export const metadata = {
  title: "Tồn kho & hạn dùng",
  description: "Theo dõi lượng dùng được thực tế và hạn dùng từng lô theo thứ tự FEFO",
};

export default function InventoryStockPage() {
  return <Suspense><StockOverviewContainer /></Suspense>;
}
