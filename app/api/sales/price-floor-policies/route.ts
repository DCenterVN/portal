import { NextRequest } from "next/server";
import { forwardSales } from "@/lib/api/sales-bff";
export function POST(request: NextRequest) { return forwardSales(request, "/sales/price-floor-policies", "POST"); }
