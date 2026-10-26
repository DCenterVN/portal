import { NextRequest } from "next/server";
import { forwardInventory } from "@/lib/api/inventory-bff";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return forwardInventory(request, `/inventory/suppliers/${encodeURIComponent(id)}`, "GET");
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return forwardInventory(request, `/inventory/suppliers/${encodeURIComponent(id)}`, "PATCH");
}
