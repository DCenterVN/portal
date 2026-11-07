import { BRAND_NAME } from "@/lib/brand";
import { ShelvesView } from "@/features/inventory/shelves-view";

export const metadata = {
  title: `Kệ hàng & Tem Truy xuất QR — ${BRAND_NAME}`,
  description: "Đưa các lô thành phẩm đã APPROVED sau QC lên kệ chi nhánh và quản lý mã QR truy vết (VT-08/16)",
};

export default function ShelvesPage() {
  return <ShelvesView />;
}
