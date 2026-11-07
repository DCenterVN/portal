import { BRAND_NAME } from "@/lib/brand";
import { OrdersView } from "@/features/products/orders-view";

export const metadata = { title: `Đơn hàng — ${BRAND_NAME}` };

export default function OrdersPage() { return <OrdersView />; }
