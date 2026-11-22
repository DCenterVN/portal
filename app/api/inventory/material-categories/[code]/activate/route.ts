import { NextRequest } from "next/server";
import { forwardInventory } from "@/lib/api/inventory-bff";

type Context = { params: Promise<{ code: string }> };

export async function POST(request: NextRequest, context: Context) {
  const { code } = await context.params;
  return forwardInventory(request, `/inventory/material-categories/${encodeURIComponent(code)}/activate`, "POST");
}
