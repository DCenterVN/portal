import { NextRequest, NextResponse } from "next/server";

type ServiceMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

interface ForwardServiceOptions {
  baseUrl: string;
  path: string;
  method: ServiceMethod;
  bodyPolicy?: "none" | "required";
  requireAuth?: boolean;
  unavailableMessage: string;
}

export async function forwardService(request: NextRequest, options: ForwardServiceOptions) {
  const bodyPolicy = options.bodyPolicy ?? ((options.method === "GET" || options.method === "DELETE") ? "none" : "required");
  const requireAuth = options.requireAuth ?? true;
  const headers: Record<string, string> = { Accept: "application/json" };

  if (requireAuth) {
    const accessToken = request.cookies.get("access_token")?.value;
    if (!accessToken) {
      return NextResponse.json({ error: "unauthenticated", message: "Chưa đăng nhập" }, { status: 401, headers: { "Cache-Control": "no-store" } });
    }
    headers.Authorization = `Bearer ${accessToken}`;
  }

  const idempotencyKey = request.headers.get("idempotency-key");
  if (idempotencyKey) headers["Idempotency-Key"] = idempotencyKey;
  const ifMatch = request.headers.get("if-match");
  if (ifMatch) headers["If-Match"] = ifMatch;

  let body: string | undefined;
  if (bodyPolicy === "required") {
    try {
      body = JSON.stringify(await request.json());
      headers["Content-Type"] = "application/json";
    } catch {
      return NextResponse.json({ error: "validation_failed", message: "Nội dung JSON không hợp lệ" }, { status: 400, headers: { "Cache-Control": "no-store" } });
    }
  }

  try {
    const upstream = await fetch(`${options.baseUrl}${options.path}`, {
      method: options.method,
      headers,
      ...(body ? { body } : {}),
      cache: "no-store",
    });
    const responseBody = await upstream.text();
    const requestId = upstream.headers.get("x-request-id");
    return new NextResponse(upstream.status === 204 ? null : responseBody || null, {
      status: upstream.status,
      headers: {
        "Cache-Control": "no-store",
        "Content-Type": upstream.headers.get("content-type") || "application/json",
        ...(requestId ? { "X-Request-ID": requestId } : {}),
      },
    });
  } catch {
    return NextResponse.json({ error: "upstream_unavailable", message: options.unavailableMessage }, { status: 502, headers: { "Cache-Control": "no-store" } });
  }
}
