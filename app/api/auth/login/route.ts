import { NextRequest, NextResponse } from "next/server";

const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || "http://localhost:8080";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const res = await fetch(`${AUTH_SERVICE_URL}/auth/web/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Forwarded-For": req.headers.get("x-forwarded-for") || "127.0.0.1",
        "User-Agent": req.headers.get("user-agent") || "portal-bff",
      },
      body: JSON.stringify(body),
    });

    const data = await res.json();
    const nextRes = NextResponse.json(data, { status: res.status });

    // Forward Set-Cookie headers (refresh_token & CSRF-Token)
    const setCookieHeaders = res.headers.getSetCookie();
    setCookieHeaders.forEach((cookie) => {
      nextRes.headers.append("Set-Cookie", cookie);
    });

    // Also set access_token cookie for client-side routing
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
