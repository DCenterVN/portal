import { BRAND_NAME } from "@/lib/brand";
import { ShelvesView } from "@/features/inventory/shelves-view";

export const metadata = {
  title: `Kệ hàng & Tem Truy xuất QR — ${BRAND_NAME}`,
  description: "Đưa lô thành phẩm đã đạt QC lên kệ chi nhánh và quản lý mã QR truy xuất",
};

export default function ShelvesPage() {
  return <ShelvesView />;
}
