import { ShelvesView } from "@/features/inventory/shelves-view";

export const metadata = {
  title: "Kệ hàng & tem truy xuất",
  description: "Đưa lô thành phẩm đã đạt QC lên kệ chi nhánh và quản lý mã QR truy xuất",
};

export default function ShelvesPage() {
  return <ShelvesView />;
}
