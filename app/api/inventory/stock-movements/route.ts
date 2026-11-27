import { NextRequest } from "next/server";
import { forwardInventory } from "@/lib/api/inventory-bff";

export function GET(request: NextRequest) {
  return forwardInventory(request, `/inventory/stock-movements${request.nextUrl.search}`, "GET");
}
