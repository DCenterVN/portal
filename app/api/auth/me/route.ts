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
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (err: unknown) {
    return NextResponse.json({ error: "internal_error", message: err instanceof Error ? err.message : String(err) }, { status: 500 });
  }
}
