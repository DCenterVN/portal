import { NextRequest } from "next/server";
import { forwardSales } from "@/lib/api/sales-bff";

export async function GET(request: NextRequest) {
  return forwardSales(request, `/sales/price-book-versions${request.nextUrl.search}`, "GET");
}
