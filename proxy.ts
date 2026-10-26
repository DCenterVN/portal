import {CONSOLE_ROUTES, isEmployeeRoute} from "./lib/fetcher";
import {AUTH_FORBIDDEN_ERROR} from "./lib/api/auth-journey-bff";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PUBLIC_PREFIXES = [
  "/login", "/register", "/activate", "/forgot-password", "/reset-password",
  "/traceability", "/products", "/api/auth", "/api/public", "/healthz", "/readyz", "/_next", "/favicon.ico", "/icon.svg",
];

function matchesPathPrefix(pathname: string, prefix: string): boolean {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (matchesPathPrefix(pathname, "/staff/register")) return new NextResponse(null, {status: 404});
  const staffPublic = ["/staff/login", "/staff/forgot-password", "/staff/reset-password", "/staff/invite/accept", "/invite/accept"].includes(pathname);
  const isPublic = staffPublic || pathname === "/" || PUBLIC_PREFIXES.some((path) => matchesPathPrefix(pathname, path));
  const hasAccessToken = request.cookies.has("access_token");
  const hasRefreshToken = request.cookies.has("__Host-refresh_token") || request.cookies.has("refresh_token");

  if (!isPublic && !hasAccessToken && !hasRefreshToken) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({error: "UNAUTHORIZED"}, {status: 401, headers: {"Cache-Control": "no-store"}});
    }
    const loginUrl = new URL(isEmployeeRoute(pathname) ? "/staff/login" : "/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }
  if (matchesPathPrefix(pathname, "/api/console") && (hasAccessToken || hasRefreshToken) && request.cookies.get("portal_plane")?.value !== "employee") {
    return NextResponse.json(AUTH_FORBIDDEN_ERROR, {status: 403, headers: {"Cache-Control": "no-store"}});
  }
  // UI gate only; org remains responsible for data authorization.
  if (CONSOLE_ROUTES.some(path => matchesPathPrefix(pathname, path)) && request.cookies.get("portal_plane")?.value !== "employee") {
    const contextUrl = new URL("/staff/switch-org", request.url);
    contextUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(contextUrl);
  }
  return NextResponse.next();
}

export const config = { matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"] };
