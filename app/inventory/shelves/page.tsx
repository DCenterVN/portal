import { ShelvesView } from "@/features/inventory/shelves-view";
import { getShelfPlacements } from "@/lib/api/production";

export const metadata = {
  title: "Kệ hàng & Tem Truy xuất QR — Việt Sạch",
  description: "Đưa các lô thành phẩm đã APPROVED sau QC lên kệ chi nhánh và quản lý mã QR truy vết (VT-08/16)",
};

export default async function ShelvesPage() {
  const initialPlacements = await getShelfPlacements().catch(() => []);
  return <ShelvesView initialPlacements={initialPlacements} />;
}
