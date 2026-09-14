import { NextRequest } from "next/server";
import { forwardProduction } from "@/lib/api/production-bff";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return forwardProduction(request, `/production/targets/${encodeURIComponent(id)}/food-plans`, "POST");
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return forwardProduction(request, `/production/targets/${encodeURIComponent(id)}/food-plans`, "GET");
}
