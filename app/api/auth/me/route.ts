import { publicError } from "@/lib/api/public-error";
import { NextRequest, NextResponse } from "next/server";

const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || "http://localhost:8080";

export async function GET(req: NextRequest) {
  try {
    const accessToken = req.cookies.get("access_token")?.value || "";
    if (!accessToken) {
      return NextResponse.json({ error: "unauthorized", message: "Chưa đăng nhập" }, { status: 401 });
    }
    const res = await fetch(`${AUTH_SERVICE_URL}/auth/me`, {
      headers: {
        "Authorization": `Bearer ${accessToken}`,
      },
      cache: "no-store",
    });

    const data = await res.json();
    const headers: Record<string, string> = { "Cache-Control": "no-store" };
    const retry = res.headers?.get("retry-after");
    if (retry) headers["Retry-After"] = retry;
    const payload = res.ok ? data : publicError(data) || { error: "INTERNAL_ERROR" };
    return NextResponse.json(payload, { status: res.status, headers });
  } catch {
    return NextResponse.json({ error: "internal_error", message: "Không thể tải thông tin tài khoản" }, { status: 500 });
  }
}
