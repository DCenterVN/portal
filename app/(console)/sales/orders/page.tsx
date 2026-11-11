import { RequireAction } from "@/lib/access-boundary";
import { SalesOrdersView } from "@/features/sales/orders-view";
import { BRAND_NAME } from "@/lib/brand";

export const metadata = { title: `Đơn hàng — ${BRAND_NAME}` };
export default function SalesOrdersPage() {
  return <RequireAction action="sales:order:read"><SalesOrdersView /></RequireAction>;
}
