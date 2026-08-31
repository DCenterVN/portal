import { notFound } from "next/navigation";
import { getProductById } from "@/lib/api/sales";
import { ProductDetailView } from "@/features/products/product-detail-view";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { data: product } = await getProductById(id);
  return {
    title: product ? `${product.name} — Việt Sạch` : "Chi tiết Sản phẩm — Việt Sạch",
  };
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { data: product } = await getProductById(id);

  if (!product) {
    notFound();
  }

  return <ProductDetailView initialProduct={product} />;
}
