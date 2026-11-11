import { BRAND_NAME } from "@/lib/brand";
import { TraceView } from "@/features/traceability/trace-view";

export const dynamic = "force-dynamic";

export const metadata = {
  title: `Truy xuất Nguồn gốc Thực phẩm — ${BRAND_NAME}`,
  description: "Nguồn gốc nguyên liệu và hành trình sản xuất của hộp món",
};

export default async function TraceabilityPage({ params }: { params: Promise<{ code: string }> }) {
	const { code } = await params;
	return <TraceView code={code} />;
}
