import { Suspense } from "react";
import { BRAND_NAME } from "@/lib/brand";
import { StorageLocationsContainer } from "@/features/inventory/storage-locations/storage-locations-container";

export const metadata = {
  title: `Vị trí kho — ${BRAND_NAME}`,
  description: "Danh mục vị trí kho của chi nhánh dùng khi gán vị trí cho lô nguyên liệu",
};

export default function StorageLocationsPage() {
  return <Suspense><StorageLocationsContainer /></Suspense>;
}
