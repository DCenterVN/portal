import { NextRequest } from "next/server";
import { forwardSales } from "@/lib/api/sales-bff";
export async function POST(request: NextRequest, { params }: { params: Promise<{ policy_id: string }> }) {
	const value = await params;
	return forwardSales(request, `/sales/price-floor-policies/${encodeURIComponent(value.policy_id)}/versions`, "POST");
}
