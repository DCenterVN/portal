import { NextRequest } from "next/server";
import { forwardSales } from "@/lib/api/sales-bff";

export async function GET(request: NextRequest) {
  return forwardSales(request, `/sales/skus${request.nextUrl.search}`, "GET");
}

export async function POST(request: NextRequest) {
  return forwardSales(request, "/sales/skus", "POST");
}
