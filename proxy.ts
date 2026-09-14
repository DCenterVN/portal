import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PUBLIC_PREFIXES = [
  "/login", "/register", "/activate", "/forgot-password", "/reset-password",
  "/traceability", "/api/auth", "/api/public", "/healthz", "/readyz", "/_next", "/favicon.ico",
];

function matchesPathPrefix(pathname: string, prefix: string): boolean {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isPublic = pathname === "/" || PUBLIC_PREFIXES.some((path) => matchesPathPrefix(pathname, path));
  const hasAccessToken = request.cookies.has("access_token");
  const hasRefreshToken = request.cookies.has("__Host-refresh_token") || request.cookies.has("refresh_token");

  if (!isPublic && !hasAccessToken && !hasRefreshToken) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }
  if ((pathname === "/login" || pathname === "/register") && hasAccessToken) {
    return NextResponse.redirect(new URL("/", request.url));
  }
  return NextResponse.next();
}

export const config = { matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"] };
