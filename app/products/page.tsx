import { getProducts } from "@/lib/api/sales";
import { ProductsView } from "@/features/products/products-view";

export const metadata = {
  title: "Danh mục Sản phẩm & Bán hàng — Việt Sạch",
  description: "Quản lý danh mục mặt hàng thực phẩm sạch, kích hoạt mở bán và điều phối đơn hàng",
};

export default async function ProductsPage() {
  const { data: products, source } = await getProducts();
  return <ProductsView initialProducts={products} dataSource={source} />;
}
