import { z } from "zod";
import { NextRequest, NextResponse } from "next/server";
import { decodePlatform } from "./platform-contract";
import { accountResponseSchemas, sessionsSchema } from "./account-types";
import { accountOperations, type AccountOperation } from "./account-validation";
import { authHeaders, resolveClientIP } from "./client-ip";
import { publicError } from "./public-error";

const noStore = { "Cache-Control": "no-store" };
function failure(code: string, status: number) {
  return NextResponse.json({ error: code }, { status, headers: noStore });
}
function trusted(req: NextRequest) {
  const configured = process.env.NEXT_PUBLIC_SITE_URL || (process.env.NODE_ENV !== "production" ? req.nextUrl.origin : "");
  try {
    const origin = new URL(configured);
    const site = req.headers.get("sec-fetch-site");
    const json = req.headers.get("content-type")?.split(";")[0].trim() === "application/json";
    return json && ["http:", "https:"].includes(origin.protocol) && !origin.username && !origin.password && req.headers.get("origin") === origin.origin && (site === null || site === "same-origin");
  } catch { return false; }
}
async function readBody(req: NextRequest, operation: AccountOperation) {
  const raw = await req.text();
  if (new TextEncoder().encode(raw).length > 16384) return failure("BAD_REQUEST", 400);
  let body: unknown;
  try { body = raw ? JSON.parse(raw) : undefined; }
  catch { return failure("BAD_REQUEST", 400); }
  const parsed = accountOperations[operation].schema.safeParse(body);
  return parsed.success ? parsed.data : failure("VALIDATION_ERROR", 400);
}
function upstreamHeaders(req: NextRequest) {
  const explicit: Record<string, string> = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${req.cookies.get("access_token")!.value}`,
    "User-Agent": req.headers.get("user-agent") || "portal-bff",
  };
  const cookies = ["refresh_token", "__Host-refresh_token", "CSRF-Token"];
  const pairs = cookies.filter(hasCookie).map(cookiePair);
  function hasCookie(name: string) { return req.cookies.has(name); }
  function cookiePair(name: string) { return `${name}=${req.cookies.get(name)!.value}`; }
  if (pairs.length) explicit.Cookie = pairs.join("; ");
  const csrf = req.headers.get("x-csrf-token") || req.cookies.get("CSRF-Token")?.value;
  if (csrf) explicit["X-CSRF-Token"] = csrf;
  return authHeaders(resolveClientIP(req.headers), explicit);
}
async function upstreamFailure(upstream: Response) {
  const body = await upstream.json().catch(invalidJson);
  const projected = body && typeof body === "object" ? publicError(body) : null;
  const response = NextResponse.json(projected || { error: "INTERNAL_ERROR" }, { status: upstream.status, headers: noStore });
  const retry = upstream.headers.get("retry-after");
  if (retry) response.headers.set("Retry-After", retry);
  return response;
}
function invalidJson() { return null; }
function clearSession(response: NextResponse) {
  for (const name of ["access_token", "refresh_token", "__Host-refresh_token", "CSRF-Token", "portal_plane"]) {
    response.cookies.set(name, "", { path: "/", maxAge: 0, secure: name.startsWith("__Host-") || process.env.NODE_ENV === "production", sameSite: "strict", httpOnly: name !== "CSRF-Token" });
  }
  return response;
}
async function mutationResponse(upstream: Response, operation: AccountOperation) {
  if (operation === "password" || operation === "logoutAll") {
    if (upstream.status !== 204) return failure("INTERNAL_ERROR", 503);
    return clearSession(new NextResponse(null, { status: 204, headers: noStore }));
  }
  if (operation === "emailChange" || operation === "emailConfirm") {
    const status = operation === "emailChange" ? "pending" : "success";
    const expected = operation === "emailChange" ? 202 : 200;
    if (upstream.status !== expected) return failure("INTERNAL_ERROR", 503);
    const data = z.object({ status: z.literal(status) }).parse(await upstream.json());
    const result = NextResponse.json(data, { status: expected, headers: noStore });
    return operation === "emailConfirm" ? clearSession(result) : result;
  }
  const schema: z.ZodTypeAny = accountResponseSchemas[operation];
  const data = decodePlatform(await upstream.json(), schema);
  return NextResponse.json({ code: 200, status: "success", message: "", data }, { headers: noStore });
}
export async function accountMutation(req: NextRequest, operation: AccountOperation) {
  if (!trusted(req)) return failure("FORBIDDEN", 403);
  if (!req.cookies.get("access_token")?.value) return failure("UNAUTHORIZED", 401);
  if (operation === "emailChange" && req.cookies.get("portal_plane")?.value === "employee") return failure("FORBIDDEN", 403);
  try {
    const body = await readBody(req, operation);
    if (body instanceof NextResponse) return body;
    const contract = accountOperations[operation];
    const upstream = await fetch(`${process.env.AUTH_SERVICE_URL || "http://localhost:8080"}/auth/${contract.path}`, {
      method: contract.method, cache: "no-store", signal: AbortSignal.timeout(10000), headers: upstreamHeaders(req),
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
    if (!upstream.ok) return await upstreamFailure(upstream);
    return await mutationResponse(upstream, operation);
  } catch { return failure("INTERNAL_ERROR", 503); }
}
export async function accountSessions(req: NextRequest, id?: string) {
  if (!req.cookies.get("access_token")?.value) return failure("UNAUTHORIZED", 401);
  if (id && !trusted(req)) return failure("FORBIDDEN", 403);
  if (id && !z.string().uuid().safeParse(id).success) return failure("BAD_REQUEST", 400);
  const page = req.nextUrl.searchParams.get("page") || "1";
  if (!id && !/^[1-9]\d{0,5}$/.test(page)) return failure("BAD_REQUEST", 400);
  const path = id ? `sessions/${encodeURIComponent(id)}` : `sessions?page=${page}&limit=10`;
  try {
    const upstream = await fetch(`${process.env.AUTH_SERVICE_URL || "http://localhost:8080"}/auth/${path}`, {
      method: id ? "DELETE" : "GET", cache: "no-store", signal: AbortSignal.timeout(10000), headers: upstreamHeaders(req),
    });
    if (!upstream.ok) return await upstreamFailure(upstream);
    if (id) {
      if (upstream.status !== 204) return failure("INTERNAL_ERROR", 503);
      return new NextResponse(null, { status: 204, headers: noStore });
    }

    return NextResponse.json(sessionsSchema.parse(await upstream.json()), { headers: noStore });
  } catch { return failure("INTERNAL_ERROR", 503); }
}
