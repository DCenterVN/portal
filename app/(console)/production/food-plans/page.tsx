import { FoodPlansView } from "@/features/production/food-plans-view";
import { getFoodPlans } from "@/lib/api/production";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Kế hoạch Dinh dưỡng & BOM — Việt Sạch",
  description: "Chuyên gia dinh dưỡng xây dựng công thức, định lượng nguyên liệu và xuất bản lệnh sản xuất (VT-21)",
};

export default async function FoodPlansPage({ searchParams }: { searchParams: Promise<{ target_id?: string }> }) {
  const { target_id: targetId } = await searchParams;
  const initialPlans = targetId ? await getFoodPlans(targetId).catch(() => []) : [];
  return <FoodPlansView initialPlans={initialPlans} targetId={targetId} />;
}
