import { NextRequest } from "next/server";
import { forwardSales } from "@/lib/api/sales-bff";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return forwardSales(request, `/sales/orders/${encodeURIComponent(id)}/cancel`, "POST");
}
