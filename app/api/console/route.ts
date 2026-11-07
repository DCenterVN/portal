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
    permissions: payload.permissions,
  });
}
