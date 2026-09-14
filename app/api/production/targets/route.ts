import { NextRequest } from "next/server";
import { forwardProduction } from "@/lib/api/production-bff";

export function POST(request: NextRequest) {
  return forwardProduction(request, "/production/targets", "POST");
}

export function GET(request: NextRequest) {
  return forwardProduction(request, `/production/targets${request.nextUrl.search}`, "GET");
}
