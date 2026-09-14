import { NextRequest } from "next/server";
import { forwardProduction } from "@/lib/api/production-bff";

export async function GET(request: NextRequest, { params }: { params: Promise<{ trace_code: string }> }) {
  const { trace_code } = await params;
  return forwardProduction(request, `/public/traceability/${encodeURIComponent(trace_code)}`, "GET", "none", false);
}
