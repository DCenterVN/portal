import { MaterialRequirementsView } from "@/features/production/material-requirements-view";

export const metadata = {
  title: "Nhu cầu nguyên liệu",
  description: "Tổng hợp lượng nguyên liệu cần chuẩn bị và giá tham chiếu theo chỉ tiêu",
};

export default async function MaterialRequirementsPage({ searchParams }: { searchParams: Promise<{ target_id?: string; food_plan_id?: string }> }) {
  const { target_id, food_plan_id } = await searchParams;
  return <MaterialRequirementsView targetId={target_id} foodPlanId={food_plan_id} />;
}
