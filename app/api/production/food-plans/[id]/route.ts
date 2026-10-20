import { NextRequest } from "next/server";
import { forwardProduction } from "@/lib/api/production-bff";

type Context = { params: Promise<{ id: string }> };
export async function GET(request: NextRequest, { params }: Context) {
  const { id } = await params;
  return forwardProduction(request, `/production/food-plans/${encodeURIComponent(id)}${request.nextUrl.search}`, "GET");
}
export async function PUT(request: NextRequest, { params }: Context) {
  const { id } = await params;
  return forwardProduction(request, `/production/food-plans/${encodeURIComponent(id)}`, "PUT");
}
