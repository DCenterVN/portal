import { NextRequest } from "next/server";
import { forwardInventory } from "@/lib/api/inventory-bff";

export function POST(request: NextRequest) {
  return forwardInventory(request, "/inventory/shelf-placements", "POST");
}

export function GET(request: NextRequest) {
  return forwardInventory(request, `/inventory/shelf-placements${request.nextUrl.search}`, "GET");
}
