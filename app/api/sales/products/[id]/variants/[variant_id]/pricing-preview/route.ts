import { NextRequest } from "next/server";
import { forwardSales } from "@/lib/api/sales-bff";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; variant_id: string }> },
) {
  const { id, variant_id } = await params;
  return forwardSales(
    request,
    `/sales/products/${encodeURIComponent(id)}/variants/${encodeURIComponent(variant_id)}/pricing-preview`,
    "POST",
  );
}
