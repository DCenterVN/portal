import { NextRequest, NextResponse } from "next/server";

const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || "http://localhost:8080";

export async function POST(req: NextRequest) {
  try {
    const cookies = req.headers.get("cookie") || "";
    const csrfToken = req.cookies.get("CSRF-Token")?.value || "";
    const accessToken = req.cookies.get("access_token")?.value || "";

    await fetch(`${AUTH_SERVICE_URL}/auth/web/logout`, {
      method: "POST",
      headers: {
        "Cookie": cookies,
        "Authorization": `Bearer ${accessToken}`,
        "X-CSRF-Token": csrfToken,
        "X-Forwarded-For": req.headers.get("x-forwarded-for") || "127.0.0.1",
        "User-Agent": req.headers.get("user-agent") || "portal-bff",
      },
    });

    const nextRes = NextResponse.json({ message: "logged_out" });
    nextRes.cookies.delete("access_token");
    nextRes.cookies.delete("refresh_token");
    nextRes.cookies.delete("CSRF-Token");
    return nextRes;
  } catch (err: unknown) {
    return NextResponse.json({ error: "internal_error", message: err instanceof Error ? err.message : String(err) }, { status: 500 });
  }
}
