import { NextRequest } from "next/server";
import { forwardProduction } from "@/lib/api/production-bff";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return forwardProduction(request, `/production/targets/${encodeURIComponent(id)}/material-requirements${request.nextUrl.search}`, "GET");
}
