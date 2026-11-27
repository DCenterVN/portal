import { NextRequest, NextResponse } from "next/server";
import { forwardSales } from "@/lib/api/sales-bff";

type Context = { params: Promise<{ id: string }> };

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const badId = () => NextResponse.json({ code: 400, status: "error", message: "ID nguyên liệu không hợp lệ", errors: { error_code: "validation_failed" } }, { status: 400 });

export async function PATCH(request: NextRequest, context: Context) {
  const { id } = await context.params;
  if (!UUID_RE.test(id)) return badId();
  return forwardSales(request, `/sales/skus/${encodeURIComponent(id)}`, "PATCH");
}

export async function DELETE(request: NextRequest, context: Context) {
  const { id } = await context.params;
  if (!UUID_RE.test(id)) return badId();
  return forwardSales(request, `/sales/skus/${encodeURIComponent(id)}`, "DELETE");
}
