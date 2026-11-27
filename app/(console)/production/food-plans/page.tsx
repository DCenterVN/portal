import type { Route } from "next";
import { redirect } from "next/navigation";
import { FoodPlansView } from "@/features/production/food-plans-view";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Thực đơn & kế hoạch sản xuất",
  description: "Chuyên gia dinh dưỡng xây dựng công thức, định lượng nguyên liệu và xuất bản lệnh sản xuất (VT-21)",
};

export default async function FoodPlansPage({ searchParams }: { searchParams: Promise<{ target_id?: string; tab?: string; mon?: string; draft?: string }> }) {
  const { target_id: targetId, tab, mon, draft } = await searchParams;
  if (draft) redirect(`/production/dishes/drafts/${encodeURIComponent(draft)}` as Route);
  if (mon) redirect(`/production/dishes/${encodeURIComponent(mon)}` as Route);
  if (tab === "dishes") redirect("/production/dishes" as Route);
  return <FoodPlansView initialPlans={[]} targetId={targetId} />;
}
