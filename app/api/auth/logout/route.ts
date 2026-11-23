import { serviceUrl } from "@/lib/api/service-bff";
import { NextRequest, NextResponse } from "next/server";
import {authHeaders, resolveClientIP} from "@/lib/api/client-ip";
import { clearSession } from "@/lib/api/session-rotate";


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

    const res = await fetch(`${serviceUrl("auth")}/auth/web/logout`, {
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
