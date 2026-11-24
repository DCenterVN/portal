import { TraceView } from "@/features/traceability/trace-view";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Truy xuất nguồn gốc thực phẩm",
  description: "Nguồn gốc nguyên liệu và hành trình sản xuất của hộp món",
};

export default async function TraceabilityPage({ params }: { params: Promise<{ code: string }> }) {
	const { code } = await params;
	return <TraceView code={code} />;
}
