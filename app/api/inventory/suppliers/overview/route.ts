import { NextRequest } from "next/server";
import { forwardInventory } from "@/lib/api/inventory-bff";

export async function GET(request: NextRequest) {
  return forwardInventory(request, "/inventory/suppliers/overview", "GET");
}
