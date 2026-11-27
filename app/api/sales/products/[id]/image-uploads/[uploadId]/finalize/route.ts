import { NextRequest } from "next/server";
import { forwardSales } from "@/lib/api/sales-bff";

type Context = { params: Promise<{ id: string; uploadId: string }> };

export async function POST(request: NextRequest, context: Context) {
  const { id, uploadId } = await context.params;
  return forwardSales(request, `/sales/products/${encodeURIComponent(id)}/image-uploads/${encodeURIComponent(uploadId)}/finalize`, "POST");
}
