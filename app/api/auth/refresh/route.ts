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
        "User-Agent": req.headers.get("user-agent") || "portal-bff",
      },
    });

    const data = await res.json();
    const { access_token: accessToken, expires_in: expiresIn, ...safeData } = data;
    const nextRes = NextResponse.json(safeData, { status: res.status });

    const setCookieHeaders = res.headers.getSetCookie?.() || [];
    setCookieHeaders.forEach((cookie) => {
      if (cookie.startsWith("refresh_token=") || cookie.startsWith("__Host-refresh_token=") || cookie.startsWith("CSRF-Token=")) {
        nextRes.headers.append("Set-Cookie", cookie);
      }
    });

    if (res.ok && accessToken) {
      nextRes.cookies.set("access_token", accessToken, {
        path: "/",
        maxAge: Number(expiresIn) || 900,
        sameSite: "strict",
        httpOnly: true,
        secure: true,
      });
    }

    return nextRes;
  } catch (err: unknown) {
    return NextResponse.json({ error: "internal_error", message: err instanceof Error ? err.message : String(err) }, { status: 500 });
  }
}
