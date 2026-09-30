import { ProductDetailLoader } from "@/features/products/product-detail-loader";

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ProductDetailLoader id={id} />;
}
