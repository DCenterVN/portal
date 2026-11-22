import { NextRequest } from "next/server";
import { forwardInventory } from "@/lib/api/inventory-bff";

const FORWARDED = ["include_inactive", "q"];

export async function GET(request: NextRequest) {
  const query = new URLSearchParams([...request.nextUrl.searchParams].filter(([key]) => FORWARDED.includes(key))).toString();
  return forwardInventory(request, `/inventory/material-categories${query && `?${query}`}`, "GET");
}

export async function POST(request: NextRequest) {
  return forwardInventory(request, "/inventory/material-categories", "POST");
}
