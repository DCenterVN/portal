import { NextRequest } from "next/server";
import { forwardInventory } from "@/lib/api/inventory-bff";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string; agreementId: string }> }) {
  const { id, agreementId } = await params;
  const query = new URLSearchParams();
  for (const key of ["limit","cursor"]) {
    const value = request.nextUrl.searchParams.get(key);
    if (value !== null) query.set(key, value);
  }
  return forwardInventory(request, `/inventory/suppliers/${encodeURIComponent(id)}/agreements/${encodeURIComponent(agreementId)}/versions${query.size ? `?${query}` : ""}`, "GET");
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string; agreementId: string }> }) {
  const { id, agreementId } = await params;
  return forwardInventory(request, `/inventory/suppliers/${encodeURIComponent(id)}/agreements/${encodeURIComponent(agreementId)}/versions`, "POST");
}
