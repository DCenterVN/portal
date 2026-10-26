import { NextRequest } from "next/server";
import { forwardInventory } from "@/lib/api/inventory-bff";

export async function GET(request: NextRequest) {
  const query = new URLSearchParams();
  for (const key of ["q","status","limit","cursor"]) {
    const value = request.nextUrl.searchParams.get(key);
    if (value !== null) query.set(key, value);
  }
  return forwardInventory(request, `/inventory/suppliers${query.size ? `?${query}` : ""}`, "GET");
}

export async function POST(request: NextRequest) {
  return forwardInventory(request, `/inventory/suppliers`, "POST");
}
