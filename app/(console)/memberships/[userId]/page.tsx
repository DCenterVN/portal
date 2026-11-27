import { PersonDetail } from "@/features/memberships/person-detail";

export const metadata = { title: "Hồ sơ nhân sự" };

export default async function PersonDetailPage({ params }: { params: Promise<{ userId: string }> }) {
  const { userId } = await params;
  return <PersonDetail userId={userId} />;
}
