import { Suspense } from "react";
import { BRAND_NAME } from "@/lib/brand";
import { MaterialsView } from "@/features/production/materials-view";

export const metadata = {
  title: `Nguyên liệu — ${BRAND_NAME}`,
  description: "Danh mục nguyên liệu dùng chung cho cả tổ chức",
};

export default function MaterialsPage() {
  return <Suspense><MaterialsView /></Suspense>;
}
