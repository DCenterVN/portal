import { BRAND_NAME } from "@/lib/brand";
import { DishListScreen } from "@/features/production/dishes/dishes-container";

export const dynamic = "force-dynamic";

export const metadata = {
  title: `Món ăn — ${BRAND_NAME}`,
  description: "Danh mục món ăn và công thức định lượng theo suất",
};

export default async function DishesPage({ searchParams }: { searchParams?: Promise<{ tab?: string }> }) {
  const params = searchParams ? await searchParams : {};
  return <DishListScreen initialTab={params.tab === "drafts" ? "drafts" : "dishes"} />;
}
