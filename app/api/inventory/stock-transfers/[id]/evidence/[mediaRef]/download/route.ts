import { NextRequest } from "next/server";
import { forwardInventory } from "@/lib/api/inventory-bff";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string; mediaRef: string }> }) {
  const { id, mediaRef } = await params;
  return forwardInventory(request, `/inventory/stock-transfers/${encodeURIComponent(id)}/evidence/${encodeURIComponent(mediaRef)}/download`, "GET");
}
