import { serviceUrl } from "@/lib/api/service-bff";
import { NextRequest, NextResponse } from "next/server";
import { authHeaders, resolveClientIP } from "@/lib/api/client-ip";
import { setPortalPlane } from "@/lib/api/auth-journey-bff";


const SESSION_COOKIES = ["access_token", "__Host-refresh_token", "refresh_token", "CSRF-Token", "portal_plane"];

export function clearSession(res: NextResponse): NextResponse {
  for (const name of SESSION_COOKIES) {
    res.cookies.set(name, "", {path: "/", expires: new Date(0), maxAge: 0, ...(/^__(Host|Secure)-/.test(name) && {secure: true})});
  }
  const domain = process.env.AUTH_COOKIE_DOMAIN;
  if (domain) res.headers.append("Set-Cookie", `CSRF-Token=; Path=/; Domain=${domain}; Max-Age=0; Expires=${new Date(0).toUTCString()}`);
  return res;
}

export async function rotateSession(req: NextRequest, path: string, body?: unknown, employee = false) {
  let clientIP: string | undefined;
  try { clientIP = resolveClientIP(req.headers); }
  catch {
    return NextResponse.json({error: "INTERNAL_ERROR", message: "Dịch vụ xác thực hiện không khả dụng"}, {status: 503, headers: {"Cache-Control": "no-store"}});
  }
  try {
    const cookies = req.headers.get("cookie") || "";
    const csrfToken = req.cookies.get("CSRF-Token")?.value || "";

    const res = await fetch(`${serviceUrl("auth")}${path}`, {
      method: "POST",
      signal: AbortSignal.any([req.signal, AbortSignal.timeout(Number(process.env.AUTH_ROTATE_TIMEOUT_MS) || 10_000)]),
      headers: authHeaders(clientIP, {
        "Cookie": cookies,
        "X-CSRF-Token": csrfToken,
        "User-Agent": req.headers.get("user-agent") || "portal-bff",
        ...(body === undefined ? {} : {"Content-Type": "application/json"}),
      }),
      ...(body === undefined ? {} : {body: JSON.stringify(body)}),
    });

    const data = await res.json();
    const { access_token: accessToken, expires_in: expiresIn, ...safeData } = data;
    const retry = res.headers.get?.("retry-after");
    const nextRes = NextResponse.json(safeData, { status: res.status, headers: retry ? {"Retry-After": retry} : {} });

    if (res.ok && accessToken) {
      nextRes.cookies.set("access_token", accessToken, {
        path: "/",
        maxAge: Number(expiresIn) || 900,
        sameSite: "strict",
        httpOnly: true,
        secure: true,
      });
    }

    if (res.status === 401 || (res.status === 403 && path === "/auth/web/refresh")) return clearSession(nextRes);

    const setCookieHeaders = res.headers.getSetCookie?.() || [];
    if (res.ok && employee) setPortalPlane(nextRes, req, true, setCookieHeaders);
    setCookieHeaders.forEach((cookie) => {
      if (cookie.startsWith("refresh_token=") || cookie.startsWith("__Host-refresh_token=") || cookie.startsWith("CSRF-Token=")) {
        nextRes.headers.append("Set-Cookie", cookie);
      }
    });

    return nextRes;
  } catch (err: unknown) {
    if (err instanceof DOMException && (err.name === "TimeoutError" || err.name === "AbortError")) {
      return NextResponse.json({ error: "TIMEOUT", message: "Dịch vụ xác thực phản hồi quá chậm" }, { status: 504, headers: {"Cache-Control": "no-store"} });
    }
    return NextResponse.json({ error: "internal_error", message: err instanceof Error ? err.message : String(err) }, { status: 500 });
  }
}
