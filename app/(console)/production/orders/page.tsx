import { BRAND_NAME } from "@/lib/brand";
import { OrdersView } from "@/features/production/orders-view";

export const metadata = {
  title: `Điều hành Lệnh Sản xuất — ${BRAND_NAME}`,
  description: "Nhận lệnh, cấp nguyên liệu, nấu và đóng gói",
};

export default function OrdersPage() {
  return <OrdersView />;
}
