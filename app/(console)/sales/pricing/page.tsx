import { BRAND_NAME } from "@/lib/brand";
import { Metadata } from "next";
import { PricingFloorView } from "@/features/sales/pricing-floor-view";

export const metadata: Metadata = {
  title: `Quản lý Giá sàn & Bảng giá | ${BRAND_NAME}`,
  description: "Thiết lập và kiểm soát giá sàn động theo COGS và chính sách có version",
};

export default function SalesPricingPage() {
  return <PricingFloorView />;
}
