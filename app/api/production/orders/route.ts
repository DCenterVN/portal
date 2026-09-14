import { NextRequest } from "next/server";
import { forwardProduction } from "@/lib/api/production-bff";

export function GET(request: NextRequest) {
  return forwardProduction(request, `/production/orders${request.nextUrl.search}`, "GET");
}
