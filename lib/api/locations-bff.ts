import { NextRequest, NextResponse } from "next/server";
import { forwardService, serviceUrl } from "@/lib/api/service-bff";

export async function forwardLocations(request: NextRequest, path: string) {
  try {
    const response = await forwardService(request, {
      baseUrl: serviceUrl("integration"), path, method: "GET", requireAuth: false,
      unavailableMessage: "Không tải được danh sách địa chỉ. Vui lòng thử lại.",
    });
    await response.clone().json();
    return response;
  } catch {
    return NextResponse.json({ error: "upstream_unavailable", message: "Không tải được danh sách địa chỉ. Vui lòng thử lại." }, { status: 502 });
  }
}
