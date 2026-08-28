import { NextRequest, NextResponse } from "next/server";

const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || "http://localhost:8080";

export async function POST(req: NextRequest) {
  try {
    const accessToken = req.cookies.get("access_token")?.value || "";
    if (!accessToken) {
      return NextResponse.json({ error: "unauthorized", message: "Chưa đăng nhập" }, { status: 401 });
    }
    const body = await req.json();

    const res = await fetch(`${AUTH_SERVICE_URL}/auth/org-context`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${accessToken}`,
      },
      body: JSON.stringify(body),
    });

    const data = await res.json();
    const nextRes = NextResponse.json(data, { status: res.status });

    if (res.ok && data.access_token) {
      nextRes.cookies.set("access_token", data.access_token, {
        path: "/",
        maxAge: 900,
        sameSite: "strict",
      });
    }

    return nextRes;
  } catch (err: unknown) {
    return NextResponse.json({ error: "internal_error", message: err instanceof Error ? err.message : String(err) }, { status: 500 });
  }
}
