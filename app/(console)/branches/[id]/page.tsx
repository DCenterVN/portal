import { BranchDetailView } from "@/features/branches/branch-detail-view";

export default async function BranchDetailPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ moi?: string }> }) {
  const { id } = await params;
  const { moi } = await searchParams;
  return <BranchDetailView branchId={id} justCreated={moi === "1"} />;
}
