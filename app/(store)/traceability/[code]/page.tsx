import { TraceView } from "@/features/traceability/trace-view";
import { getPublicTraceability } from "@/lib/api/production";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Truy xuất Nguồn gốc Thực phẩm — Việt Sạch",
  description: "Cổng thông tin minh bạch nguồn gốc và nhật ký sản xuất an toàn (VT-01)",
};

export default async function TraceabilityPage({ params }: { params: Promise<{ code: string }> }) {
	const { code } = await params;
	const trace = await getPublicTraceability(code);

	return <TraceView trace={trace} />;
}
