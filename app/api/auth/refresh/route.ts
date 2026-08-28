import { NextRequest, NextResponse } from "next/server";

const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || "http://localhost:8080";

export async function POST(req: NextRequest) {
  try {
    const cookies = req.headers.get("cookie") || "";
    const csrfToken = req.cookies.get("CSRF-Token")?.value || "";

    const res = await fetch(`${AUTH_SERVICE_URL}/auth/web/refresh`, {
      method: "POST",
      headers: {
        "Cookie": cookies,
        "X-CSRF-Token": csrfToken,
        "X-Forwarded-For": req.headers.get("x-forwarded-for") || "127.0.0.1",
        "User-Agent": req.headers.get("user-agent") || "portal-bff",
      },
    });

    const data = await res.json();
    const nextRes = NextResponse.json(data, { status: res.status });

    const setCookieHeaders = res.headers.getSetCookie();
    setCookieHeaders.forEach((cookie) => {
      nextRes.headers.append("Set-Cookie", cookie);
    });

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
