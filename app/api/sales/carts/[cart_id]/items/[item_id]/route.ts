import { NextRequest } from "next/server";
import { forwardSales } from "@/lib/api/sales-bff";

type Context = { params: Promise<{ cart_id: string; item_id: string }> };
async function forward(request: NextRequest, { params }: Context, method: "PATCH" | "DELETE") {
  const { cart_id, item_id } = await params;
  const query = new URLSearchParams();
  const branch = request.nextUrl.searchParams.get("branch_id");
  if (branch) query.set("branch_id", branch);
  return forwardSales(request, `/sales/carts/${encodeURIComponent(cart_id)}/items/${encodeURIComponent(item_id)}${query.size ? `?${query}` : ""}`, method);
}
export const PATCH = (request: NextRequest, context: Context) => forward(request, context, "PATCH");
export const DELETE = (request: NextRequest, context: Context) => forward(request, context, "DELETE");
