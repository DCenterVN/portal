export const CONSOLE_ROUTES = ["/account", "/audit", "/branches", "/branches/[id]", "/console", "/inventory/inbound-qc", "/inventory/shelves", "/inventory/storage-locations", "/inventory/stock-transfers", "/inventory/stock-transfers/new", "/inventory/stock-transfers/[id]", "/inventory/stock-transfers/[id]/receive", "/inventory/suppliers", "/inventory/suppliers/new", "/inventory/suppliers/overview", "/inventory/suppliers/[id]", "/inventory/suppliers/[id]/receipts", "/inventory/suppliers/[id]/info", "/inventory/suppliers/[id]/edit", "/inventory/suppliers/[id]/prices/new", "/inventory/suppliers/[id]/prices/[agreementId]", "/inventory/goods-receipts/new", "/inventory/goods-receipts/[id]/receive", "/memberships", "/memberships/[userId]", "/production/dishes", "/production/dishes/[id]", "/production/dishes/drafts/[draftId]", "/production/food-plans", "/production/material-requirements", "/production/materials", "/production/orders", "/production/qc", "/production/targets", "/roles", "/sales/orders", "/sales/pricing", "/sales/products"] as const;
export function isEmployeeRoute(pathname: string): boolean {
  return [...CONSOLE_ROUTES, "/staff", "/switch-branch", "/switch-org"].some(path => pathname === path || pathname.startsWith(`${path}/`));
}

export const FORBIDDEN_MESSAGE = "Tài khoản của bạn chưa có quyền xem hoặc thực hiện việc này ở chi nhánh đang chọn.";

export class FetchError extends Error {
  info: unknown;
  status: number;
  code?: string;
  retryAfterMs?: number;
  serviceMessage: string;

  constructor(message: string, status: number, info?: unknown, retryAfter?: string | null) {
    super(status === 403 ? FORBIDDEN_MESSAGE : message);
    this.serviceMessage = message;
    this.name = "FetchError";
    this.status = status;
    this.info = info;
    if (info && typeof info === "object" && "error" in info && typeof info.error === "string") {
      this.code = info.error;
    }
    const header = retryAfter?.trim();
    const delay = header && /^\d+$/.test(header) ? Number(header) * 1000
      : header && /^[A-Za-z]{3},? /.test(header) ? Date.parse(header) - Date.now() : NaN;
    if (Number.isFinite(delay)) {
      this.retryAfterMs = Math.min(Number.MAX_SAFE_INTEGER, Math.max(0, delay));
    } else if (info && typeof info === "object" && "retry_after_ms" in info &&
      typeof info.retry_after_ms === "number" && Number.isFinite(info.retry_after_ms) && info.retry_after_ms >= 0) {
      this.retryAfterMs = Math.min(Number.MAX_SAFE_INTEGER, info.retry_after_ms);
    }
  }
}

const EXEMPT_AUTH_ENDPOINTS = [
  "/api/auth/refresh",
  "/api/auth/web/switch-branch",
  "/api/auth/login",
  "/api/auth/logout",
  "/api/auth/register",
  "/api/auth/forgot",
  "/api/auth/reset",
  "/api/auth/activate",
  "/api/auth/activate/resend",
  "/api/auth/staff/login",
  "/api/auth/staff/forgot",
  "/api/auth/staff/reset",
  "/api/auth/staff/invite/accept",
];

function isExemptUrl(url: string | URL | Request): boolean {
  const input = typeof url === "string" ? url : url instanceof URL ? url.href : url.url;
  try {return EXEMPT_AUTH_ENDPOINTS.includes(new URL(input, "http://portal.invalid").pathname);}
  catch {return false;}
}

let refreshPromise: Promise<RefreshResult> | null = null;

function resolveFetchInput(url: string | URL | Request): string | URL | Request {
  if (typeof window === "undefined" && typeof url === "string" && url.startsWith("/")) {
    const origin = process.env.PORTAL_INTERNAL_URL || `http://127.0.0.1:${process.env.PORT || "3000"}`;
    return new URL(url, origin);
  }
  return url;
}

const REFRESHED_AT_KEY = "auth:refreshed-at";
const REFRESH_FAILED_AT_KEY = "auth:refresh-failed-at";
const REFRESH_TIMEOUT_MS = Number(process.env.NEXT_PUBLIC_AUTH_REFRESH_TIMEOUT_MS) || 15_000;
const REFRESH_ATTEMPTS = 3;
const REFRESH_BACKOFF_MS = 500;
const CSRF_COOKIE = /(?:^|;\s*)CSRF-Token=[^;]/;

export type RefreshResult = boolean | "unavailable";

function readStamp(key: string): number {
  try {
    const at = Number(globalThis.localStorage?.getItem(key)) || 0;
    return at > Date.now() ? 0 : at;
  }
  catch {return 0;}
}

function writeStamp(key: string) {
  try {globalThis.localStorage?.setItem(key, String(Date.now()));}
  catch {return;}
}

export function markRefreshFailed() {
  writeStamp(REFRESH_FAILED_AT_KEY);
}

export function markRefreshed() {
  writeStamp(REFRESHED_AT_KEY);
}

let queueTail: Promise<unknown> = Promise.resolve();

function runQueued<T>(run: () => Promise<T>): Promise<T> {
  const next = queueTail.then(run, run);
  queueTail = next.catch(() => undefined);
  return next;
}

export async function withRefreshLock<T>(run: () => Promise<T>): Promise<T> {
  const locks = globalThis.navigator?.locks;
  if (!locks) return runQueued(run);
  let started = false;
  return locks.request("auth-refresh", async () => {
    started = true;
    return run();
  }).catch((error) => {
    if (started) throw error;
    return runQueued(run);
  });
}

async function refreshAttempt(): Promise<true | number> {
  try {
    const res = await fetch(resolveFetchInput("/api/auth/refresh"), { method: "POST", signal: AbortSignal.timeout(REFRESH_TIMEOUT_MS) });
    return res.ok || res.status;
  } catch {
    return 0;
  }
}

async function refreshOnce(since: number): Promise<RefreshResult> {
  if (typeof document !== "undefined" && !CSRF_COOKIE.test(document.cookie)) return false;
  if (readStamp(REFRESHED_AT_KEY) >= since) return true;
  if (readStamp(REFRESH_FAILED_AT_KEY) >= since) return "unavailable";
  const result = await refreshWithRetry();
  if (result === "unavailable") markRefreshFailed();
  return result;
}

async function refreshWithRetry(): Promise<RefreshResult> {
  for (let attempt = 1; ; attempt++) {
    const outcome = await refreshAttempt();
    if (outcome === true) {
      markRefreshed();
      return true;
    }
    if (outcome === 0 || outcome === 429 || (outcome >= 500 && outcome !== 503)) return "unavailable";
    if (outcome !== 503) return false;
    if (attempt >= REFRESH_ATTEMPTS) return "unavailable";
    await new Promise((resolve) => setTimeout(resolve, REFRESH_BACKOFF_MS * 2 ** (attempt - 1)));
  }
}

export async function doRefresh(since = Date.now()): Promise<RefreshResult> {
  if (!refreshPromise) {
    refreshPromise = withRefreshLock(() => refreshOnce(since)).finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

export function redirectToLogin() {
  if (typeof window === "undefined") return;
  const currentPath = window.location.pathname;
  const login = isEmployeeRoute(currentPath) ? "/staff/login" : "/login";
  if (currentPath !== "/login" && currentPath !== "/staff/login") {
    window.location.href = `${login}?redirect=${encodeURIComponent(currentPath)}`;
  }
}

export async function apiFetch(
  url: string | URL | Request,
  init?: RequestInit,
  isRetry = false
): Promise<Response> {
  const startedAt = Date.now();
  const res = await fetch(resolveFetchInput(url), init);

  if (res.status === 401 && !isRetry && !isExemptUrl(url)) {
    const refreshed = await doRefresh(startedAt);
    if (refreshed === true) {
      return apiFetch(url, init, true);
    }
    if (refreshed === "unavailable") {
      return new Response(JSON.stringify({ error: "refresh_unavailable", message: "Hệ thống tạm lỗi, thử lại sau" }), { status: 503 });
    }
    redirectToLogin();
  }

  return res;
}

export async function fetcher<T = unknown>(url: string, init?: RequestInit): Promise<T> {
  const res = await apiFetch(url, init);

  if (!res.ok) {
    let errorInfo: Record<string, unknown> | null = null;
    try {
      errorInfo = (await res.json()) as Record<string, unknown>;
    } catch {
      errorInfo = { message: res.statusText };
    }

    const message =
      (errorInfo && typeof errorInfo.message === "string" && errorInfo.message) ||
      (errorInfo && typeof errorInfo.error === "string" && errorInfo.error) ||
      `An error occurred while fetching data (${res.status})`;

    throw new FetchError(message, res.status, errorInfo, res.headers?.get("retry-after"));
  }

  return (await res.json()) as T;
}

export async function mutationFetcher<T = unknown, Extra = unknown>(
  url: string,
  { arg }: { arg?: Extra }
): Promise<T> {
  return fetcher<T>(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: arg !== undefined ? JSON.stringify(arg) : undefined,
  });
}
