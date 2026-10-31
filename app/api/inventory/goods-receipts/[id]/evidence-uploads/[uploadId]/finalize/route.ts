import { NextRequest } from "next/server";
import { forwardInventory } from "@/lib/api/inventory-bff";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string; uploadId: string }> }) {
  const { id, uploadId } = await params;
  return forwardInventory(request, `/inventory/goods-receipts/${encodeURIComponent(id)}/evidence-uploads/${encodeURIComponent(uploadId)}/finalize`, "POST");
}
