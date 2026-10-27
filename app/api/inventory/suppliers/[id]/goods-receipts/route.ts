import { NextRequest } from "next/server";
import { forwardInventory } from "@/lib/api/inventory-bff";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const query = new URLSearchParams();
  for (const key of ["page_size", "cursor", "from", "to"]) {
    const value = request.nextUrl.searchParams.get(key);
    if (value !== null) query.set(key, value);
  }
  return forwardInventory(request, `/inventory/suppliers/${encodeURIComponent(id)}/goods-receipts${query.size ? `?${query}` : ""}`, "GET");
}
