import { NextRequest } from "next/server";
import { forwardSales } from "@/lib/api/sales-bff";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const branch = request.nextUrl.searchParams.get("branch_id");
  return forwardSales(request, `/sales/catalog/${encodeURIComponent(id)}${branch ? `?branch_id=${encodeURIComponent(branch)}` : ""}`, "GET", "none", false);
}
