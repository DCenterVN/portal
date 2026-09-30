import { RoleMatrixView } from "@/features/platform/role-matrix-view";

export default async function RoleMatrixPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <RoleMatrixView root={id} />;
}
