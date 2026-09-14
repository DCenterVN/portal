import { OrdersView } from "@/features/production/orders-view";
import { getOrders } from "@/lib/api/production";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Điều hành Lệnh Sản xuất — Việt Sạch",
  description: "Quy trình Make-to-Stock: Tiếp nhận → Phân bổ FEFO → Sơ chế & Nấu → Đóng gói & Cấp đông",
};

export default async function OrdersPage() {
  const initialOrders = await getOrders().catch(() => []);
  return <OrdersView initialOrders={initialOrders} />;
}
