import { NextRequest } from "next/server";
import { forwardSales } from "@/lib/api/sales-bff";
export async function POST(request: NextRequest, { params }: { params: Promise<{ price_book_id: string }> }) {
	const value = await params;
	return forwardSales(request, `/sales/price-books/${encodeURIComponent(value.price_book_id)}/versions`, "POST");
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ price_book_id: string }> }) {
  const { price_book_id } = await params;
  return forwardSales(request, `/sales/price-books/${encodeURIComponent(price_book_id)}/versions${request.nextUrl.search}`, "GET");
}
