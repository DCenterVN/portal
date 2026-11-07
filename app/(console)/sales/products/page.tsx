import { BRAND_NAME } from "@/lib/brand";
import { ProductsLoader } from "@/features/products/products-loader";

export const metadata = { title: `Sản phẩm — ${BRAND_NAME}` };

export default function SalesProductsPage() { return <ProductsLoader />; }
