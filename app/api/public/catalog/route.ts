import { NextRequest } from "next/server";
import { forwardSales } from "@/lib/api/sales-bff";

export async function GET(request: NextRequest) {
  const query = new URLSearchParams();
  for (const key of ["cursor", "page_size", "branch_id"]) {
    const value = request.nextUrl.searchParams.get(key);
    if (value) query.set(key, value);
  }
  const qs = query.toString();
  return forwardSales(request, `/sales/catalog${qs ? `?${qs}` : ""}`, "GET", "none", false);
}
