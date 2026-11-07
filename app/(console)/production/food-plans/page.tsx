import { BRAND_NAME } from "@/lib/brand";
import { FoodPackWorkspace } from "@/features/production/food-plans-view";

export const dynamic = "force-dynamic";

export const metadata = {
  title: `Món & thực đơn — ${BRAND_NAME}`,
  description: "Chuyên gia dinh dưỡng xây dựng công thức, định lượng nguyên liệu và xuất bản lệnh sản xuất (VT-21)",
};

export default async function FoodPlansPage({ searchParams }: { searchParams: Promise<{ target_id?: string; tab?: string; mon?: string; mode?: string; draft?: string }> }) {
  const { target_id: targetId, tab, mon, mode, draft } = await searchParams;
  return <FoodPackWorkspace targetId={targetId} tab={tab} mon={mon} mode={mode} draft={draft} />;
}
