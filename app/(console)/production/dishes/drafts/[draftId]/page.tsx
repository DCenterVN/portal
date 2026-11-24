import { BRAND_NAME } from "@/lib/brand";
import { DishDraftScreen } from "@/features/production/dishes/dishes-container";

export const dynamic = "force-dynamic";

export const metadata = {
  title: `Soạn món ăn — ${BRAND_NAME}`,
  description: "Soạn công thức, định lượng và hoàn tất món ăn",
};

export default async function DishDraftPage({ params }: { params: Promise<{ draftId: string }> }) {
  const { draftId } = await params;
  return <DishDraftScreen draftId={draftId} />;
}
