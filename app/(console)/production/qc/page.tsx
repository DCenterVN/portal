import { QCView } from "@/features/production/qc-view";
import { getOrders } from "@/lib/api/production";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Kiểm định QC Thành phẩm — Việt Sạch",
  description: "Nghiệm thu chất lượng an toàn thực phẩm và cấp đông (VT-13 SoD)",
};

export default async function QCPage() {
  const allOrders = await getOrders().catch(() => []);
  const qcEligibleOrders = allOrders.filter((o) => o.status === "COMPLETED" || o.status === "QC_PASSED" || o.status === "QC_FAILED");
  return <QCView completedOrders={qcEligibleOrders} />;
}
