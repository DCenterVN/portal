import { Metadata } from "next";
import { PricingFloorView } from "@/features/sales/pricing-floor-view";

export const metadata: Metadata = {
  title: "Quản lý Giá sàn & Bảng giá | VietSach",
  description: "Thiết lập và kiểm soát giá sàn động theo COGS và chính sách có version",
};

export default function SalesPricingPage() {
  return <PricingFloorView />;
}
