import { RequireAction } from "@/lib/access-boundary";
import { SalesOrdersView } from "@/features/sales/orders-view";

export const metadata = { title: "Đơn hàng" };
export default function SalesOrdersPage() {
  return <RequireAction action="sales:order:read"><SalesOrdersView /></RequireAction>;
}
