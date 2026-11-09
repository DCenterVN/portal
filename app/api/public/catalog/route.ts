import { NextRequest } from "next/server";
import { forwardSales } from "@/lib/api/sales-bff";

export async function GET(request: NextRequest) {
  const query = new URLSearchParams();
  for (const key of ["cursor", "page_size", "branch_id", "kcal_max", "protein_min", "label"]) {
    for (const value of request.nextUrl.searchParams.getAll(key)) {
      if (value) query.append(key, value);
    }
  }
  const qs = query.toString();
  return forwardSales(request, `/sales/catalog${qs ? `?${qs}` : ""}`, "GET", "none", false);
}
