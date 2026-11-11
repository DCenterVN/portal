import { BRAND_NAME } from "@/lib/brand";
import { QCView } from "@/features/production/qc-view";

export const metadata = {
  title: `Kiểm định QC Thành phẩm — ${BRAND_NAME}`,
  description: "Nghiệm thu chất lượng an toàn thực phẩm",
};

export default function QCPage() {
  return <QCView />;
}
