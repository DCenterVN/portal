import { CartView } from "@/features/products/cart-view";

export const metadata = {
  title: "Giỏ hàng",
  description: "Kiểm tra giỏ hàng và tạo đơn hàng từ danh mục sản phẩm",
};

export default function CartPage() {
  return <CartView />;
}
