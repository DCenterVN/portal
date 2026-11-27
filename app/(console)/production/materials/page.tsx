import { Suspense } from "react";
import { MaterialsView } from "@/features/production/materials-view";

export const metadata = {
  title: "Nguyên liệu",
  description: "Danh mục nguyên liệu dùng chung cho cả tổ chức",
};

export default function MaterialsPage() {
  return <Suspense><MaterialsView /></Suspense>;
}
