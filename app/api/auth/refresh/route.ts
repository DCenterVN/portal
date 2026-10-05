import { NextRequest, NextResponse } from "next/server";
import {authHeaders, resolveClientIP} from "@/lib/api/client-ip";

const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || "http://localhost:8080";

export async function POST(req: NextRequest) {
  let clientIP: string | undefined;
  try { clientIP = resolveClientIP(req.headers); }
  catch {
    return NextResponse.json({error: "INTERNAL_ERROR", message: "Dịch vụ xác thực hiện không khả dụng"}, {status: 503, headers: {"Cache-Control": "no-store"}});
  }
  try {
    const cookies = req.headers.get("cookie") || "";
    const csrfToken = req.cookies.get("CSRF-Token")?.value || "";

    const res = await fetch(`${AUTH_SERVICE_URL}/auth/web/refresh`, {
      method: "POST",
      headers: authHeaders(clientIP, {
        "Cookie": cookies,
        "X-CSRF-Token": csrfToken,
        "User-Agent": req.headers.get("user-agent") || "portal-bff",
      }),
    });

    const data = await res.json();
    const { access_token: accessToken, expires_in: expiresIn, ...safeData } = data;
    const retry = res.headers.get?.("retry-after");
    const nextRes = NextResponse.json(safeData, { status: res.status, headers: retry ? {"Retry-After": retry} : {} });

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
