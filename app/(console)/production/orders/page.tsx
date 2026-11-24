import { OrdersView } from "@/features/production/orders-view";

export const metadata = {
  title: "Lệnh sản xuất & chế biến",
  description: "Nhận lệnh, cấp nguyên liệu, nấu và đóng gói",
};

export default function OrdersPage() {
  return <OrdersView />;
}
