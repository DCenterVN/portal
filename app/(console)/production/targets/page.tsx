import { TargetsView } from "@/features/production/targets-view";
import { getTargets } from "@/lib/api/production";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Chỉ tiêu Sản xuất — Việt Sạch",
  description: "Quản lý và phê duyệt chỉ tiêu kế hoạch định kỳ cho toàn chuỗi (VT-14 / VT-15)",
};

export default async function TargetsPage() {
  const initialTargets = await getTargets().catch(() => []);
  return <TargetsView initialTargets={initialTargets} />;
}
