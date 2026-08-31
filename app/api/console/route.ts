import { NextRequest, NextResponse } from "next/server";
import { GET as getAuthContext } from "@/app/api/auth/context/route";

export async function GET(request: NextRequest) {
  const response = await getAuthContext(request);
  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    return NextResponse.json(
      payload || { error: "console_unavailable", message: "Không thể tải dữ liệu vận hành" },
      { status: response.status },
    );
  }
  return NextResponse.json({
    user: payload.user,
    contexts: payload.contexts,
    active_context: payload.active_context,
    permissions: payload.permissions,
    limitations: [
      "Backend chưa có API service-health tổng hợp",
      "Backend chưa có API audit feed cho portal",
      "Order hiện chỉ hỗ trợ tạo trạng thái CREATED",
    ],
  });
}
