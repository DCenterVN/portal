import { NextRequest } from "next/server";
import { forwardInventory } from "@/lib/api/inventory-bff";

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return forwardInventory(request, `/inventory/inbound-qc-inspections/${encodeURIComponent(id)}/temperature-result`, "PUT");
}
