import { NextRequest } from "next/server";
import { forwardSales } from "@/lib/api/sales-bff";

export function GET(request: NextRequest) {
  const query = request.nextUrl.search;
  return forwardSales(request, `/sales/products${query}`, "GET");
}

export function POST(request: NextRequest) {
  return forwardSales(request, "/sales/products", "POST");
}
