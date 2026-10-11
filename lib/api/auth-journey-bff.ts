import "server-only";
import {authHeaders, resolveClientIP} from "./client-ip";
import {decodePlatform, platformMeSchema} from "./platform-contract";
import {CONSOLE_ROUTES} from "../fetcher";
import { NextRequest, NextResponse } from "next/server";

const authUrl = () => process.env.AUTH_SERVICE_URL || "http://localhost:8080";
const orgUrl = () => process.env.ORG_INTERNAL_URL || process.env.ORG_SERVICE_URL || "http://localhost:8081";
type Journey = "customer" | "employee";
type Json = Record<string, unknown>;
const object = (value: unknown): value is Json => !!value && typeof value === "object" && !Array.isArray(value);
const response = (data: unknown, status = 200, retry?: string | null) => NextResponse.json(data, {status, headers: {"Cache-Control": "no-store", ...(retry ? {"Retry-After": retry} : {})}});
const unavailable = () => response({error: "INTERNAL_ERROR", message: "Dịch vụ xác thực hiện không khả dụng"}, 503);
const publicError = (data: Json): Json | null => {
  const code = object(data.errors) && typeof data.errors.error_code === "string" ? data.errors.error_code : data.error;
  if (typeof code !== "string" || !code) return null;
  const fields = object(data.errors) && Array.isArray(data.errors.fields) ? data.errors.fields
    .filter((field: unknown): field is Json => object(field) && typeof field.field === "string" && typeof field.message === "string")
    .map(field => ({field: field.field, message: field.message})) : [];
  return {error: code,
    ...(typeof data.message === "string" ? {message: data.message} : {}),
    ...(typeof data.retryable === "boolean" ? {retryable: data.retryable} : {}),
    ...(typeof data.retry_after_ms === "number" && Number.isFinite(data.retry_after_ms) ? {retry_after_ms: data.retry_after_ms} : {}),
    ...(fields.length ? {errors: {fields}} : {})};
};
// Existing public site URL is shared with layout/robots/sitemap; no listener or proxy headers.
const publicOrigin = () => {
  const configured = process.env.NEXT_PUBLIC_SITE_URL || (process.env.NODE_ENV !== "production" ? "http://localhost:3000" : "");
  try {
    const url = new URL(configured);
    return ["http:", "https:"].includes(url.protocol) && !url.username && !url.password ? url.origin : null;
  } catch { return null; }
};
export const AUTH_FORBIDDEN_ERROR = {error: "FORBIDDEN"} as const;
const forbidden = () => response({...AUTH_FORBIDDEN_ERROR, message: "Tài khoản này chưa có quyền nhân viên. Đăng nhập mua hàng tại /login"}, 403);

export function safeLanding(target: string, journey: Journey): string {
  const fallback = journey === "customer" ? "/" : "/staff/switch-branch";
  try {
    const decoded = decodeURIComponent(target);
    if (!decoded.startsWith("/") || decoded.startsWith("//") || decoded.includes("\\")) return fallback;
    const url = new URL(decoded, "https://portal.invalid");
    if (url.origin !== "https://portal.invalid") return fallback;
    const pathname = url.pathname;
    if (journey === "employee") {
      if (["/staff/switch-org", "/staff/switch-branch", "/platform/companies"].includes(pathname)) return !url.search && !url.hash ? pathname : fallback;
      return CONSOLE_ROUTES.some(path => pathname === path || pathname.startsWith(`${path}/`)) ? `${pathname}${url.search}${url.hash}` : fallback;
    }
    if (pathname !== "/" && !/^\/(products|cart|checkout|orders|me)(\/|$)/.test(pathname)) return fallback;
    return `${pathname}${url.search}${url.hash}`;
  } catch { return fallback; }
}

async function readFields(req: NextRequest, allowed: readonly string[], required: readonly string[], authenticated = false): Promise<Json | NextResponse> {
  const origin = req.headers.get("origin");
  const site = req.headers.get("sec-fetch-site");
  const json = req.headers.get("content-type")?.split(";", 1)[0].trim().toLowerCase() === "application/json";
  const sameOrigin = site !== null ? site === "same-origin" : origin !== null && origin === publicOrigin();
  if (!json || !sameOrigin) return response({error: "FORBIDDEN", message: "Yêu cầu không hợp lệ"}, 403);
  if (authenticated && !req.cookies.get("access_token")?.value) return response({error:"UNAUTHORIZED"},401);
  let body: unknown;
  try { body = await req.json(); } catch { return response({error: "BAD_REQUEST", message: "Nội dung JSON không hợp lệ"}, 400); }
  if (!object(body)) return response({error: "VALIDATION_ERROR", message: "Thông tin không hợp lệ"}, 400);
  if (Object.keys(body).some(key => !allowed.includes(key))) return response({error: "BAD_REQUEST", message: "Trường không thuộc yêu cầu"}, 400);
  if (Object.values(body).some(value => typeof value !== "string") || required.some(key => typeof body[key] !== "string" || !(body[key] as string).trim())) return response({error: "VALIDATION_ERROR", message: "Vui lòng nhập đầy đủ thông tin"}, 400);
  return body;
}

function sessionCookies(upstream: Response): string[] {
  return (upstream.headers.getSetCookie?.() ?? []).filter(cookie => /^(refresh_token|__Host-refresh_token|CSRF-Token)=/.test(cookie));
}
function setPortalPlane(result: NextResponse, req: NextRequest, employee: boolean, cookies: string[] = []) {
  const refresh = cookies.find(cookie => /^(refresh_token|__Host-refresh_token)=/.test(cookie));
  const maxAge = refresh?.match(/;\s*Max-Age=(-?\d+)/i)?.[1];
  const sameSite = refresh?.match(/;\s*SameSite=(Strict|Lax|None)(?:\s*;|\s*$)/i)?.[1].toLowerCase() as "strict" | "lax" | "none" | undefined;
  // Without refresh rotation, its remaining TTL is unavailable: use a session marker.
  result.cookies.set("portal_plane", employee ? "employee" : "", {
    httpOnly: true, path: "/", sameSite: sameSite ?? "strict",
    secure: refresh ? /;\s*Secure(?:\s*;|\s*$)/i.test(refresh) : req.cookies.has("__Host-refresh_token") || !req.cookies.has("refresh_token"),
    ...(!employee ? {maxAge: 0} : maxAge !== undefined ? {maxAge: Number(maxAge)} : {}),
  });
}
async function revoke(req: NextRequest, token: string, cookies: string[]): Promise<void> {
  const pairs = cookies.map(cookie => cookie.split(";")[0]);
  const csrf = pairs.find(cookie => cookie.startsWith("CSRF-Token="))?.slice("CSRF-Token=".length) ?? "";
  await fetch(`${authUrl()}/auth/web/logout`, {method: "POST", cache: "no-store", headers: authHeaders(resolveClientIP(req.headers), {Cookie: pairs.join("; "), Authorization: `Bearer ${token}`, "X-CSRF-Token": csrf, "User-Agent": req.headers.get("user-agent") || "portal-bff"})});
}
async function upstreamError(upstream: Response): Promise<NextResponse> {
  const data: unknown = await upstream.json().catch(() => null);
  const projected = object(data) ? publicError(data) : null;
  return projected ? response(projected, upstream.status, upstream.headers.get("retry-after")) : unavailable();
}
async function loginError(upstream: Response): Promise<NextResponse> {
  const res = await upstreamError(upstream);
  const seconds = Number(upstream.headers.get("retry-after"));
  if (upstream.status !== 429 || !Number.isFinite(seconds) || seconds < 0) return res;
  const data = await res.json();
  return response({retry_after_ms: seconds * 1000, ...data}, 429, upstream.headers.get("retry-after"));
}
interface Context { org_id: string; branch_id: string; member_type: string; roles: string[]; status?: string }
function contexts(value: unknown): Context[] | null {
  if (!Array.isArray(value) || value.some(row => !object(row) || typeof row.org_id !== "string" || !row.org_id || typeof row.branch_id !== "string" || !row.branch_id || typeof row.member_type !== "string" || !Array.isArray(row.roles) || row.roles.some((role: unknown) => typeof role !== "string") || (row.status !== undefined && typeof row.status !== "string"))) return null;
  return value as Context[];
}
function activeStaffContexts(rows: Context[]): Context[] {
  // Org includes ACTIVE memberships/branches only; reject explicit inactive rows too.
  const employees = rows.filter(row => row.member_type === "EMPLOYEE" && (row.status === undefined || row.status === "ACTIVE"));
  return [...new Map(employees.map(row => [JSON.stringify([row.org_id, row.branch_id]), row])).values()];
}
async function staffDecision(token: string, clientIP: string | undefined): Promise<{next_path: string; token: string; expires_in?: number; cookies?: string[]} | NextResponse> {
  const platform = await fetch(`${orgUrl()}/platform/me`, {headers: {Authorization: `Bearer ${token}`}, cache: "no-store"});
  if (platform.ok) {
    decodePlatform(await platform.json(), platformMeSchema);
    return {next_path: "/platform/companies", token};
  }
  if (platform.status !== 404) return upstreamError(platform);
  const upstream = await fetch(`${orgUrl()}/org/access-contexts/me`, {headers: {Authorization: `Bearer ${token}`}, cache: "no-store"});
  if (!upstream.ok) return upstreamError(upstream);
  const rows = contexts(await upstream.json());
  if (!rows) return unavailable();
  const distinct = activeStaffContexts(rows);
  if (!distinct.length) return forbidden();
  if (new Set(distinct.map(row => row.org_id)).size > 1) return {next_path: "/staff/switch-org", token};
  if (distinct.length > 1) return {next_path: "/staff/switch-branch", token};
  const {org_id, branch_id} = distinct[0];
  const switched = await fetch(`${authUrl()}/auth/org-context`, {method: "POST", cache: "no-store", headers: authHeaders(clientIP, {"Content-Type": "application/json", Authorization: `Bearer ${token}`}), body: JSON.stringify({org_id, branch_id})});
  if (!switched.ok) return upstreamError(switched);
  const data: unknown = await switched.json();
  if (!object(data) || typeof data.access_token !== "string" || !data.access_token) return unavailable();
  return {next_path: "/console", token: data.access_token, expires_in: typeof data.expires_in === "number" ? data.expires_in : undefined, cookies: sessionCookies(switched)};
}

export async function loginJourney(req: NextRequest, journey: Journey): Promise<NextResponse> {
  const result = await authenticateJourney(req, journey);
  // Failed login also removes an old marker; no deletion is needed when none exists.
  if (req.cookies.has("portal_plane") && !result.cookies.has("portal_plane")) setPortalPlane(result, req, false);
  return result;
}

async function authenticateJourney(req: NextRequest, journey: Journey): Promise<NextResponse> {
  const fields = await readFields(req, ["identifier", "password", "redirect"], ["identifier", "password"]);
  if (fields instanceof NextResponse) return fields;
  const {redirect, ...body} = fields;
  let temporaryToken = ""; let cookies: string[] = []; let accepted = false;
  try {
    const clientIP = resolveClientIP(req.headers);
    const upstream = await fetch(`${authUrl()}/auth/web/login`, {method: "POST", cache: "no-store", headers: authHeaders(clientIP, {"Content-Type": "application/json", "User-Agent": req.headers.get("user-agent") || "portal-bff"}), body: JSON.stringify(body)});
    if (!upstream.ok) return loginError(upstream);
    cookies = sessionCookies(upstream);
    const data: unknown = await upstream.json();
    if (!object(data) || typeof data.access_token !== "string" || !data.access_token) return unavailable();
    temporaryToken = data.access_token;
    const profile = await fetch(`${authUrl()}/auth/me`, {cache: "no-store", headers: authHeaders(clientIP, {Authorization: `Bearer ${temporaryToken}`})});
    if (!profile.ok) return upstreamError(profile);
    const user: unknown = await profile.json();
    if (!object(user) || typeof user.id !== "string" || user.status !== "ACTIVE") return response({error: "FORBIDDEN", reason: "NOT_ACTIVATED", message: "Tài khoản chưa được kích hoạt"}, 403);
    const decision = journey === "customer" ? {next_path: "/", token: temporaryToken, expires_in: undefined, cookies: undefined} : await staffDecision(temporaryToken, clientIP);
    if (decision instanceof NextResponse) return decision;
    const requested = typeof redirect === "string" && redirect ? safeLanding(redirect, journey) : "";
    const landing = requested && requested !== "/staff/switch-branch" && (journey === "customer" || decision.next_path === "/console") ? requested : safeLanding(decision.next_path, journey);
    const result = response({user: {id: user.id, email: user.email, phone: user.phone, display_name: user.display_name, status: user.status}, expires_in: decision.expires_in ?? data.expires_in, next_path: landing});
    const issuedCookies = decision.cookies?.length ? decision.cookies : cookies;
    result.cookies.set("access_token", decision.token, {path: "/", maxAge: decision.expires_in ?? (typeof data.expires_in === "number" && data.expires_in > 0 ? data.expires_in : 900), sameSite: "strict", httpOnly: true, secure: true});
    setPortalPlane(result, req, journey === "employee" && decision.next_path === "/console", [...issuedCookies, ...cookies]);
    for (const cookie of issuedCookies) result.headers.append("Set-Cookie", cookie);
    accepted = true; return result;
  } catch { return unavailable(); }
  finally { if ((temporaryToken || cookies.length) && !accepted) { try { await revoke(req, temporaryToken, cookies); } catch { /* No rejected session is published, even when auth is unavailable. */ } } }
}

const customerOperations = {
  register: {path: "/auth/register", allowed: ["email", "phone", "password", "display_name"], required: ["password"]},
  activate: {path: "/auth/activate", allowed: ["token"], required: ["token"]},
  resend: {path: "/auth/activate/resend", allowed: ["email"], required: ["email"]},
  forgot: {path: "/auth/password/forgot", allowed: ["email"], required: ["email"]},
  reset: {path: "/auth/password/reset", allowed: ["token", "new_password"], required: ["token", "new_password"]},
} as const;
export async function customerOperation(req: NextRequest, operation: keyof typeof customerOperations): Promise<NextResponse> {
  const contract = customerOperations[operation];
  const body = await readFields(req, contract.allowed, contract.required);
  if (body instanceof NextResponse) return body;
  if (operation === "register" && ((!body.email && !body.phone) || (typeof body.display_name === "string" && ([...body.display_name].length > 50 || !body.display_name.trim())))) return response({error: "VALIDATION_ERROR", message: "Vui lòng nhập email hoặc số điện thoại và tên tối đa 50 ký tự"}, 400);
  const password = operation === "register" ? body.password : body.new_password;
  if (typeof password === "string" && ([...password].length < 12 || new TextEncoder().encode(password).length > 256)) return response({error: "VALIDATION_ERROR", message: "Mật khẩu cần ít nhất 12 ký tự và tối đa 256 byte UTF-8"}, 400);
  try {
    // Auth responses need credential redaction and Retry-After preservation; forwardService lacks both.
    const upstream = await fetch(`${authUrl()}${contract.path}`, {method: "POST", cache: "no-store", headers: authHeaders(resolveClientIP(req.headers), {"Content-Type": "application/json"}), body: JSON.stringify(body)});
    if (!upstream.ok) return upstreamError(upstream);
    const data: unknown = await upstream.json();
    if (!object(data)) return unavailable();
    return response({...(typeof data.status === "string" ? {status: data.status} : {}), ...(typeof data.message === "string" ? {message: data.message} : {})}, upstream.status, upstream.headers.get("retry-after"));
  } catch { return unavailable(); }
}

export async function acceptStaffInvite(request: NextRequest) {
 const headers={"Cache-Control": "no-store"};
 const fields = await readFields(request, ["token", "password"], ["token", "password"]);
 if (fields instanceof NextResponse) return fields;
 if ([...(fields.password as string)].length<12 || new TextEncoder().encode(fields.password as string).length>256) return response({error:"VALIDATION_ERROR"},400);
 try {
  const upstream=await fetch(`${process.env.AUTH_SERVICE_URL || "http://localhost:8080"}/auth/invite/accept`,{method:"POST",cache:"no-store",headers:authHeaders(resolveClientIP(request.headers), {"Content-Type":"application/json"}),body:JSON.stringify({token:fields.token,password:fields.password})});
  if (!upstream.ok) return upstreamError(upstream);
  const data=decodePlatform(await upstream.json(), {parse(value: unknown) {
   if (!object(value) || value.status !== "activated") throw Error("Invalid invite response");
   return {status: "activated"};
  }});
  const retry=upstream.headers.get("retry-after");
  // Return only the public invite contract, never tokens or upstream cookies.
  return NextResponse.json({status:data.status},{status:upstream.status,headers:{...headers,...(retry ? {"Retry-After":retry} : {})}});
 } catch {return NextResponse.json({error:"INTERNAL_ERROR",message:"Không thể nhận lời mời lúc này."},{status:503,headers});}
}

const noStore={"Cache-Control":"no-store"};
const failure=()=>NextResponse.json({error:"INTERNAL_ERROR",message:"Không thể xác minh quyền nhân viên."},{status:503,headers:noStore});
async function verifiedContexts(request: NextRequest): Promise<Context[] | NextResponse> {
 const token=request.cookies.get("access_token")?.value;
 if(!token) return NextResponse.json({error:"UNAUTHORIZED",message:"Chưa đăng nhập."},{status:401,headers:noStore});
 const upstream=await fetch(`${process.env.ORG_INTERNAL_URL || process.env.ORG_SERVICE_URL || "http://localhost:8081"}/org/access-contexts/me`,{cache:"no-store",headers:{Authorization:`Bearer ${token}`}});
 if (!upstream.ok) return upstreamError(upstream);
 const rows=await upstream.json();
 const parsed = contexts(rows);
 if (!parsed) return failure();
 const eligible = activeStaffContexts(parsed);
 if (!eligible.length) return forbidden();
 return eligible;
}
export async function listStaffContexts(request: NextRequest) {
 try {const rows=await verifiedContexts(request);return rows instanceof NextResponse ? rows : NextResponse.json(rows.map(({org_id,branch_id,roles})=>({org_id,branch_id,roles})),{headers:noStore});}
 catch {return failure();}
}
export async function switchStaffContext(request: NextRequest) {
 const fields = await readFields(request, ["org_id", "branch_id"], ["org_id", "branch_id"], true);
 if (fields instanceof NextResponse) return fields;
 try {
  const clientIP = resolveClientIP(request.headers);
  const rows=await verifiedContexts(request);if(rows instanceof NextResponse) return rows;
  if(!rows.some(row=>row.org_id===fields.org_id && row.branch_id===fields.branch_id)) return NextResponse.json({error:"FORBIDDEN",message:"Không có quyền nhân viên tại công ty và chi nhánh đã chọn."},{status:403,headers:noStore});
  const upstream=await fetch(`${process.env.AUTH_SERVICE_URL || "http://localhost:8080"}/auth/org-context`,{method:"POST",cache:"no-store",headers:authHeaders(clientIP, {"Content-Type":"application/json",Authorization:`Bearer ${request.cookies.get("access_token")!.value}`}),body:JSON.stringify({org_id:fields.org_id,branch_id:fields.branch_id})});
  if (!upstream.ok) return upstreamError(upstream);
  const data=await upstream.json();
  if(!object(data)) return failure();
  if(typeof data.access_token!=="string" || !data.access_token) return failure();
  const result=NextResponse.json({next_path:safeLanding("/console","employee")},{headers:noStore});
  result.cookies.set("access_token",data.access_token,{path:"/",maxAge:typeof data.expires_in==="number" && data.expires_in>0 ? data.expires_in : 900,sameSite:"strict",httpOnly:true,secure:true});
  setPortalPlane(result, request, true, sessionCookies(upstream));
  for(const cookie of sessionCookies(upstream)) result.headers.append("Set-Cookie",cookie);
  return result;
 } catch {return failure();}
}
