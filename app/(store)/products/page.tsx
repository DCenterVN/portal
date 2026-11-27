import { Suspense } from "react";
import { LoadingState } from "@/components/patterns/empty-state";
import { CatalogLoader } from "@/features/products/catalog-view";

export const metadata = {
  title: "Món ngon",
  description: "Khám phá món ngon và chọn món cho bữa ăn của bạn",
};

export default function ProductsPage() { return <Suspense fallback={<LoadingState title="Đang tải món…" />}><CatalogLoader /></Suspense>; }
