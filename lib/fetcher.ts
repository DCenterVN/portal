// Derived from app/(console) pages; the route-group drift test enforces completeness.
export const CONSOLE_ROUTES = ["/account", "/branches", "/console", "/inventory/shelves", "/memberships", "/production/food-plans", "/production/material-requirements", "/production/orders", "/production/qc", "/production/targets", "/roles", "/sales/pricing"] as const;
export function isEmployeeRoute(pathname: string): boolean {
  return [...CONSOLE_ROUTES, "/staff", "/platform", "/switch-branch", "/switch-org"].some(path => pathname === path || pathname.startsWith(`${path}/`));
}

export class FetchError extends Error {
  info: unknown;
  status: number;
  code?: string;

  constructor(message: string, status: number, info?: unknown) {
    super(message);
    this.name = "FetchError";
    this.status = status;
    this.info = info;
    if (info && typeof info === "object" && "error" in info && typeof info.error === "string") {
      this.code = info.error;
    }
  }
}

const EXEMPT_AUTH_ENDPOINTS = [
  "/api/auth/refresh",
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

let refreshPromise: Promise<boolean> | null = null;

function resolveFetchInput(url: string | URL | Request): string | URL | Request {
  if (typeof window === "undefined" && typeof url === "string" && url.startsWith("/")) {
    const origin = process.env.PORTAL_INTERNAL_URL || `http://127.0.0.1:${process.env.PORT || "3000"}`;
    return new URL(url, origin);
  }
  return url;
}

async function doRefresh(): Promise<boolean> {
  if (!refreshPromise) {
    refreshPromise = fetch(resolveFetchInput("/api/auth/refresh"), { method: "POST" })
      .then((res) => res.ok)
      .catch(() => false)
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

export async function apiFetch(
  url: string | URL | Request,
  init?: RequestInit,
  isRetry = false
): Promise<Response> {
  const res = await fetch(resolveFetchInput(url), init);

  if (res.status === 401 && !isRetry && !isExemptUrl(url)) {
    const refreshed = await doRefresh();
    if (refreshed) {
      return apiFetch(url, init, true);
    }
    if (typeof window !== "undefined") {
      const currentPath = window.location.pathname;
      const staff = isEmployeeRoute(currentPath);
      const login = staff ? "/staff/login" : "/login";
      if (currentPath !== "/login" && currentPath !== "/staff/login") {
        window.location.href = `${login}?redirect=${encodeURIComponent(currentPath)}`;
      }
    }
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

    throw new FetchError(message, res.status, errorInfo);
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
