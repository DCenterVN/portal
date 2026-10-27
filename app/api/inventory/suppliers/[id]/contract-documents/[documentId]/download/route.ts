import { NextRequest } from "next/server";
import { forwardInventory } from "@/lib/api/inventory-bff";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string; documentId: string }> }) {
  const { id, documentId } = await params;
  return forwardInventory(request, `/inventory/suppliers/${encodeURIComponent(id)}/contract-documents/${encodeURIComponent(documentId)}/download`, "GET");
}
