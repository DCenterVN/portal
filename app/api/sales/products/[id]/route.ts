import { NextRequest } from "next/server";
import { forwardSales } from "@/lib/api/sales-bff";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return forwardSales(request, `/sales/products/${encodeURIComponent(id)}`, "GET");
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return forwardSales(request, `/sales/products/${encodeURIComponent(id)}`, "PATCH");
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return forwardSales(request, `/sales/products/${encodeURIComponent(id)}`, "DELETE");
}
