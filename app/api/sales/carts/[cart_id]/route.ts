import { NextRequest } from "next/server";
import { forwardSales } from "@/lib/api/sales-bff";

export async function GET(request: NextRequest, { params }: { params: Promise<{ cart_id: string }> }) {
  const { cart_id } = await params;
  const query = new URLSearchParams();
  const branch = request.nextUrl.searchParams.get("branch_id");
  if (branch) query.set("branch_id", branch);
  return forwardSales(request, `/sales/carts/${encodeURIComponent(cart_id)}${query.size ? `?${query}` : ""}`, "GET");
}
