import { NextRequest } from "next/server";
import { forwardLocations } from "@/lib/api/locations-bff";

export async function GET(request: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  return forwardLocations(request, `/locations/vn/provinces/${encodeURIComponent(code)}/communes`);
}
