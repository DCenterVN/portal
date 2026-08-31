import { NextRequest, NextResponse } from "next/server";

const SALES_SERVICE_URL =
  process.env.SALES_INTERNAL_URL ||
  process.env.SALES_SERVICE_URL ||
  "http://localhost:8086";

export async function forwardSales(
  request: NextRequest,
  path: string,
  method: "GET" | "POST",
  bodyPolicy: "none" | "required" = method === "POST" ? "required" : "none",
) {
  const accessToken = request.cookies.get("access_token")?.value;
  if (!accessToken) {
    return NextResponse.json(
      { error: "unauthenticated", message: "Chưa đăng nhập" },
      { status: 401 },
    );
  }

  let body: string | undefined;
  if (bodyPolicy === "required") {
    try {
      body = JSON.stringify(await request.json());
    } catch {
      return NextResponse.json(
        { error: "validation_failed", message: "Nội dung JSON không hợp lệ" },
        { status: 400 },
      );
    }
  }

  try {
    const upstream = await fetch(`${SALES_SERVICE_URL}${path}`, {
      method,
      headers: {
        Accept: "application/json",
        ...(body ? { "Content-Type": "application/json" } : {}),
        Authorization: `Bearer ${accessToken}`,
        ...(request.headers.get("idempotency-key")
          ? { "Idempotency-Key": request.headers.get("idempotency-key")! }
          : {}),
      },
      ...(body ? { body } : {}),
      cache: "no-store",
    });
    const responseBody = await upstream.text();
    return new NextResponse(responseBody || null, {
      status: upstream.status,
      headers: {
        "Content-Type": upstream.headers.get("content-type") || "application/json",
        ...(upstream.headers.get("x-request-id")
          ? { "X-Request-ID": upstream.headers.get("x-request-id")! }
          : {}),
      },
    });
  } catch {
    return NextResponse.json(
      { error: "upstream_unavailable", message: "Dịch vụ bán hàng hiện không khả dụng" },
      { status: 502 },
    );
  }
}
