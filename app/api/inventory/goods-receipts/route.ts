import { NextRequest } from "next/server";
import { forwardInventory } from "@/lib/api/inventory-bff";

export function POST(request: NextRequest) {
  return forwardInventory(request, "/inventory/goods-receipts", "POST");
}
