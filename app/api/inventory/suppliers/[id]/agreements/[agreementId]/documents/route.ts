import { NextRequest } from "next/server";
import { forwardInventory } from "@/lib/api/inventory-bff";

type Context = { params: Promise<{ id: string; agreementId: string }> };
export async function POST(request: NextRequest, { params }: Context) {
  const { id, agreementId } = await params;
  return forwardInventory(request, `/inventory/suppliers/${encodeURIComponent(id)}/agreements/${encodeURIComponent(agreementId)}/documents`, "POST");
}
