import ProfileClient from "./profile-client";

export default async function ProfilePage({ searchParams }: Readonly<{ searchParams: Promise<{ tab?: string }> }>) {
  const { tab } = await searchParams;
  return <ProfileClient tab={tab} />;
}
