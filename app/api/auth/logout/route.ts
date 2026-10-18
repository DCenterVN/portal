import { NextRequest, NextResponse } from "next/server";
import {authHeaders, resolveClientIP} from "@/lib/api/client-ip";

const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || "http://localhost:8080";

const SESSION_COOKIES = ["access_token", "__Host-refresh_token", "refresh_token", "CSRF-Token", "portal_plane"];

function clearSession(res: NextResponse): NextResponse {
  for (const name of SESSION_COOKIES) {
    res.cookies.set(name, "", {path: "/", expires: new Date(0), maxAge: 0, ...(/^__(Host|Secure)-/.test(name) && {secure: true})});
  }
  return res;
}

export async function POST(req: NextRequest) {
  let clientIP: string | undefined;
  try { clientIP = resolveClientIP(req.headers); }
  catch {
    return NextResponse.json({error: "INTERNAL_ERROR", message: "Dịch vụ xác thực hiện không khả dụng"}, {status: 503, headers: {"Cache-Control": "no-store"}});
  }
  try {
    const cookies = req.headers.get("cookie") || "";
    const csrfToken = req.cookies.get("CSRF-Token")?.value || "";
    const accessToken = req.cookies.get("access_token")?.value || "";

    const res = await fetch(`${AUTH_SERVICE_URL}/auth/web/logout`, {
      method: "POST",
      headers: authHeaders(clientIP, {
        "Cookie": cookies,
        "Authorization": `Bearer ${accessToken}`,
        "X-CSRF-Token": csrfToken,
        "User-Agent": req.headers.get("user-agent") || "portal-bff",
      }),
    });

    if (res.status === 429) {
      const retry = res.headers.get("retry-after");
      return clearSession(NextResponse.json(await res.json(), {status: 429, headers: retry ? {"Retry-After": retry} : {}}));
    }
    return clearSession(NextResponse.json({ message: "logged_out" }));
  } catch (err: unknown) {
    return clearSession(NextResponse.json({ error: "internal_error", message: err instanceof Error ? err.message : String(err) }, { status: 500 }));
  }
}
