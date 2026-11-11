import { NextRequest } from "next/server";
import { forwardLocations } from "@/lib/api/locations-bff";

export function GET(request: NextRequest) {
  return forwardLocations(request, "/locations/vn/provinces");
}
