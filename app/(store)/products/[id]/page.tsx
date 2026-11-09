import { ProductDetailLoader } from "@/features/products/product-detail-loader";

export default async function ProductDetailPage({
  params, searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ branch_id?: string }>;
}) {
  const { id } = await params;
  const { branch_id } = await searchParams;
  return <ProductDetailLoader id={id} branchId={branch_id} />;
}
