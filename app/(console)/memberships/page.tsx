import { MembershipsView } from "@/features/memberships/memberships-view";

export const metadata = { title: "Nhân sự & phân quyền" };

export default async function MembershipsPage({ searchParams }: { searchParams: Promise<{ membership?: string }> }) {
  const { membership } = await searchParams;
  return <MembershipsView membershipId={membership} />;
}
