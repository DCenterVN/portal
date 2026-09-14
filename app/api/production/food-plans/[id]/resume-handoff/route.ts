import { NextRequest } from "next/server";
import { forwardProduction } from "@/lib/api/production-bff";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return forwardProduction(request, `/production/food-plans/${encodeURIComponent(id)}/resume-handoff`, "POST");
}
