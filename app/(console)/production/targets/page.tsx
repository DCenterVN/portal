import { BRAND_NAME } from "@/lib/brand";
import { TargetsView } from "@/features/production/targets-view";

export const metadata = {
  title: `Chỉ tiêu Sản xuất — ${BRAND_NAME}`,
  description: "Quản lý và phê duyệt chỉ tiêu kế hoạch định kỳ cho toàn chuỗi (VT-14 / VT-15)",
};

export default function TargetsPage() {
  return <TargetsView />;
}
