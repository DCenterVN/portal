import { NextRequest } from "next/server";
import { forwardInventory } from "@/lib/api/inventory-bff";

export function GET(request: NextRequest) {
  return forwardInventory(request, `/inventory/inventory-lots${request.nextUrl.search}`, "GET");
}
