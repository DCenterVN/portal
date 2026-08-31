import { NextRequest } from "next/server";
import { forwardSales } from "@/lib/api/sales-bff";

export async function POST(request: NextRequest, { params }: { params: Promise<{ cart_id: string }> }) {
  const { cart_id } = await params;
  return forwardSales(request, `/sales/carts/${encodeURIComponent(cart_id)}/items`, "POST");
}
