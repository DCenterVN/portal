import { NextRequest } from "next/server";
import { forwardInventory } from "@/lib/api/inventory-bff";

export function GET(request: NextRequest) {
  return forwardInventory(request, `/inventory/storage-locations${request.nextUrl.search}`, "GET");
}

export function POST(request: NextRequest) {
  return forwardInventory(request, "/inventory/storage-locations", "POST");
}
