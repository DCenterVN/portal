import { NextRequest } from "next/server";
import { forwardSales } from "@/lib/api/sales-bff";

type Context = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, context: Context) {
  const { id } = await context.params;
  return forwardSales(request, `/sales/skus/${encodeURIComponent(id)}/activate`, "POST");
}
