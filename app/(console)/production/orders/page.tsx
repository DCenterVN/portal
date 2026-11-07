import { BRAND_NAME } from "@/lib/brand";
import { OrdersView } from "@/features/production/orders-view";

export const metadata = {
  title: `Điều hành Lệnh Sản xuất — ${BRAND_NAME}`,
  description: "Quy trình Make-to-Stock: Tiếp nhận → Phân bổ FEFO → Sơ chế & Nấu → Đóng gói & Cấp đông",
};

export default function OrdersPage() {
  return <OrdersView />;
}
