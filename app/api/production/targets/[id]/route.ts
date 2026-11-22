import { NextRequest } from "next/server";
import { forwardProduction } from "@/lib/api/production-bff";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return forwardProduction(request, `/production/targets/${encodeURIComponent(id)}`, "PATCH");
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return forwardProduction(request, `/production/targets/${encodeURIComponent(id)}`, "DELETE");
}
