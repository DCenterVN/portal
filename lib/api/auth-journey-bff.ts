import "server-only";
import {decodeJwt} from "jose";
import {authHeaders, resolveClientIP} from "./client-ip";
import {decodePlatform, permissionsSchema} from "./platform-contract";
import {CONSOLE_ROUTES} from "../fetcher";
import { NextRequest, NextResponse } from "next/server";
import { publicError } from "./public-error";

const authUrl = () => process.env.AUTH_SERVICE_URL || "http://localhost:8080";
const orgUrl = () => process.env.ORG_INTERNAL_URL || process.env.ORG_SERVICE_URL || "http://localhost:8081";
type Journey = "customer" | "employee";
type Json = Record<string, unknown>;
const object = (value: unknown): value is Json => !!value && typeof value === "object" && !Array.isArray(value);
const response = (data: unknown, status = 200, retry?: string | null) => NextResponse.json(data, {status, headers: {"Cache-Control": "no-store", ...(retry ? {"Retry-After": retry} : {})}});
const unavailable = () => response({error: "INTERNAL_ERROR", message: "Dịch vụ xác thực hiện không khả dụng"}, 503);
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
      if (["/staff/switch-branch", "/platform"].includes(pathname)) return !url.search && !url.hash ? pathname : fallback;
      return CONSOLE_ROUTES.some(path => pathname === path || pathname.startsWith(`${path}/`)) ? `${pathname}${url.search}${url.hash}` : fallback;
    }
    if (pathname !== "/" && !/^\/(products|cart|checkout|orders|me)(\/|$)/.test(pathname)) return fallback;
    return `${pathname}${url.search}${url.hash}`;
  } catch { return fallback; }
}

async function readFields(req: NextRequest, allowed: readonly string[], required: readonly string[]): Promise<Json | NextResponse> {
  const origin = req.headers.get("origin");
  const site = req.headers.get("sec-fetch-site");
  const json = req.headers.get("content-type")?.split(";", 1)[0].trim().toLowerCase() === "application/json";
  const sameOrigin = site !== null ? site === "same-origin" : origin !== null && origin === publicOrigin();
  if (!json || !sameOrigin) return response({error: "FORBIDDEN", message: "Yêu cầu không hợp lệ"}, 403);
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
export function setPortalPlane(result: NextResponse, req: NextRequest, employee: boolean, cookies: string[] = []) {
  const refresh = cookies.find(cookie => /^(refresh_token|__Host-refresh_token)=/.test(cookie));
  const maxAge = refresh?.match(/;\s*Max-Age=(-?\d+)/i)?.[1];
  const sameSite = refresh?.match(/;\s*SameSite=(Strict|Lax|None)(?:\s*;|\s*$)/i)?.[1].toLowerCase() as "strict" | "lax" | "none" | undefined;
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
  if (projected) return response(projected, upstream.status, upstream.headers.get("retry-after"));
  if (upstream.status === 429) return response({error: "rate_limit_exceeded"}, 429, upstream.headers.get("retry-after"));
  return unavailable();
}
async function loginError(upstream: Response): Promise<NextResponse> {
  const res = await upstreamError(upstream);
  if (upstream.status === 403 && (await res.clone().json().catch(() => null))?.error === "user_not_active") return response({error: "FORBIDDEN", reason: "NOT_ACTIVATED", message: "Tài khoản chưa được kích hoạt"}, 403);
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
function activeStaffContexts(rows: Context[], token: string): Context[] {
  const {org_id, branch_id} = decodeJwt(token);
  if (typeof org_id !== "string" || !org_id || typeof branch_id !== "string" || !branch_id) return [];
  const employees = rows.filter(row => row.org_id === org_id && row.branch_id === branch_id && row.member_type === "EMPLOYEE" && (row.status === undefined || row.status === "ACTIVE"));
  return [...new Map(employees.map(row => [JSON.stringify([row.org_id, row.branch_id]), row])).values()];
}
type Decision = {next_path: string; token: string; expires_in?: number; cookies?: string[]};
type Session = {clientIP: string | undefined; userAgent: string; cookies: string[]};
async function rotateToEmployeeBranch(branch: string, session: Session): Promise<{token: string; expires_in?: number; cookies: string[]} | NextResponse> {
  const pairs = session.cookies.map(cookie => cookie.split(";")[0]);
  const csrf = pairs.find(cookie => cookie.startsWith("CSRF-Token="))?.slice("CSRF-Token=".length) ?? "";
  const upstream = await fetch(`${authUrl()}/auth/web/switch-branch`, {method: "POST", cache: "no-store", headers: authHeaders(session.clientIP, {"Content-Type": "application/json", Cookie: pairs.join("; "), "X-CSRF-Token": csrf, "User-Agent": session.userAgent}), body: JSON.stringify({branch_id: branch})});
  if (!upstream.ok) return upstreamError(upstream);
  const data: unknown = await upstream.json();
  if (!object(data) || typeof data.access_token !== "string" || !data.access_token) return unavailable();
  return {token: data.access_token, expires_in: typeof data.expires_in === "number" ? data.expires_in : undefined, cookies: sessionCookies(upstream)};
}
function otherBranches(rows: Context[], token: string): Context[] {
  const {org_id} = decodeJwt(token);
  const mine = rows.filter(row => row.org_id === org_id && row.member_type === "EMPLOYEE" && (row.status === undefined || row.status === "ACTIVE"));
  return [...new Map(mine.map(row => [row.branch_id, row])).values()];
}
async function staffDecision(token: string, session: Session): Promise<Decision | NextResponse> {
  const upstream = await fetch(`${orgUrl()}/org/access-contexts/me`, {headers: {Authorization: `Bearer ${token}`}, cache: "no-store"});
  if (!upstream.ok) return upstreamError(upstream);
  const rows = contexts(await upstream.json());
  if (!rows) return unavailable();
  let active = token; let expires_in: number | undefined; let cookies: string[] | undefined;
  let distinct = activeStaffContexts(rows, active);
  if (!distinct.length) {
    const branches = otherBranches(rows, active);
    if (!branches.length) return forbidden();
    if (branches.length > 1) return {next_path: "/staff/switch-branch", token};
    const rotated = await rotateToEmployeeBranch(branches[0].branch_id, session);
    if (rotated instanceof NextResponse) return rotated;
    ({token: active, expires_in, cookies} = rotated);
    distinct = activeStaffContexts(rows, active);
    if (!distinct.length) return forbidden();
  }
  const {org_id, branch_id} = distinct[0];
  const permissions = await fetch(`${orgUrl()}/org/permissions/me?${new URLSearchParams({org_id, branch_id})}`, {headers: {Authorization: `Bearer ${active}`}, cache: "no-store"});
  if (!permissions.ok) return upstreamError(permissions);
  const {action_keys} = permissionsSchema.parse(await permissions.json());
  return {next_path: action_keys.includes("org:role:update") ? "/platform" : "/console", token: active, expires_in, cookies};
}

export async function loginJourney(req: NextRequest, journey: Journey): Promise<NextResponse> {
  const result = await authenticateJourney(req, journey);
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
    const decision = journey === "customer" ? {next_path: "/", token: temporaryToken, expires_in: undefined, cookies: undefined} : await staffDecision(temporaryToken, {clientIP, userAgent: req.headers.get("user-agent") || "portal-bff", cookies});
    if (decision instanceof NextResponse) return decision;
    const requested = typeof redirect === "string" && redirect ? safeLanding(redirect, journey) : "";
    const landing = requested && requested !== "/staff/switch-branch" && requested !== "/platform" && (journey === "customer" || decision.next_path === "/console") ? requested : safeLanding(decision.next_path, journey);
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
  activate: {path: "/auth/activate", allowed: ["token", "password"], required: ["token", "password"]},
  resend: {path: "/auth/activate/resend", allowed: ["email"], required: ["email"]},
  forgot: {path: "/auth/password/forgot", allowed: ["email"], required: ["email"]},
  reset: {path: "/auth/password/reset", allowed: ["token", "new_password"], required: ["token", "new_password"]},
} as const;
export async function customerOperation(req: NextRequest, operation: keyof typeof customerOperations): Promise<NextResponse> {
  const contract = customerOperations[operation];
  const body = await readFields(req, contract.allowed, operation === "activate" ? ["token"] : contract.required);
  if (body instanceof NextResponse) return body;
  if (operation === "register" && ((!body.email && !body.phone) || (typeof body.display_name === "string" && ([...body.display_name].length > 50 || !body.display_name.trim())))) return response({error: "VALIDATION_ERROR", message: "Vui lòng nhập email hoặc số điện thoại và tên tối đa 50 ký tự"}, 400);
  const password = operation === "register" || operation === "activate" ? body.password : body.new_password;
  if (operation === "activate" && typeof password !== "string") return response({error: "VALIDATION_ERROR", message: "Vui lòng nhập đầy đủ thông tin"}, 400);
  if (typeof password === "string" && ([...password].length < 12 || new TextEncoder().encode(password).length > 256)) return response({error: "VALIDATION_ERROR", message: "Mật khẩu cần ít nhất 12 ký tự và tối đa 256 byte UTF-8"}, 400);
  try {
    const upstream = await fetch(`${authUrl()}${contract.path}`, {method: "POST", cache: "no-store", headers: authHeaders(resolveClientIP(req.headers), {"Content-Type": "application/json"}), body: JSON.stringify(body)});
    if (!upstream.ok) return upstreamError(upstream);
    const data: unknown = await upstream.json();
    if (!object(data)) return unavailable();
    if (operation === "activate") {
      if (upstream.status !== 200 || data.code !== 200 || data.status !== "success" || data.message !== "OK") return unavailable();
      return response({status: "success"});
    }
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
  return NextResponse.json({status:data.status},{status:upstream.status,headers:{...headers,...(retry ? {"Retry-After":retry} : {})}});
 } catch {return NextResponse.json({error:"INTERNAL_ERROR",message:"Không thể nhận lời mời lúc này."},{status:503,headers});}
}
