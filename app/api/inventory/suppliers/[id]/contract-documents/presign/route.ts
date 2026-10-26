import { NextRequest } from "next/server";
import { forwardInventory } from "@/lib/api/inventory-bff";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return forwardInventory(request, `/inventory/suppliers/${encodeURIComponent(id)}/contract-documents/presign`, "POST");
}
