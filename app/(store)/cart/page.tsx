import { BRAND_NAME } from "@/lib/brand";
import { CartView } from "@/features/products/cart-view";

export const metadata = {
  title: `Giỏ hàng & Tạo Đơn — ${BRAND_NAME}`,
  description: "Kiểm tra giỏ hàng và tạo đơn hàng từ danh mục sản phẩm",
};

export default function CartPage() {
  return <CartView />;
}
