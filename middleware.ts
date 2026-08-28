import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Public routes that do not require an active login session
const PUBLIC_PATHS = [
  "/login",
  "/register",
  "/activate",
  "/forgot-password",
  "/reset-password",
  "/api/auth",
  "/healthz",
  "/readyz",
  "/_next",
  "/favicon.ico",
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isPublic = PUBLIC_PATHS.some((path) => pathname.startsWith(path));
  const hasAccessToken = request.cookies.has("access_token");
  const hasRefreshToken = request.cookies.has("__Host-refresh_token");

  if (!isPublic && !hasAccessToken && !hasRefreshToken) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // If already logged in and navigating to login/register, redirect to dashboard
  if ((pathname === "/login" || pathname === "/register") && hasAccessToken) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
