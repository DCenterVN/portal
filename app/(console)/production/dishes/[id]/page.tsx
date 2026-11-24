import { BRAND_NAME } from "@/lib/brand";
import { DishDetailScreen } from "@/features/production/dishes/dishes-container";

export const dynamic = "force-dynamic";

export const metadata = {
  title: `Chi tiết món ăn — ${BRAND_NAME}`,
  description: "Chi tiết biến thể, công thức và giá vốn món ăn",
};

export default async function DishDetailPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ variant?: string }> }) {
  const [{ id }, { variant }] = await Promise.all([params, searchParams]);
  return <DishDetailScreen dishId={id} initialVariant={variant} />;
}
