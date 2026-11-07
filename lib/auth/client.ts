import { apiFetch, FetchError } from "../fetcher";

export interface UserProjection {
  id: string;
  email: string;
  phone: string;
  display_name: string;
  status: string;
}

export interface UserProfile {
  avatar_url?: string | null;
  id: string;
  email: string;
  phone: string;
  display_name: string;
  status: string;
  created_at: string;
  memberships: {
    org_id: string;
    org_name: string;
    branch_id?: string;
    branch_name?: string;
    roles: string[];
  }[];
}

export function logout(): Promise<Response> {
  return apiFetch("/api/auth/logout", { method: "POST" });
}

export async function logoutTo(loginPath: string, onError?: (message: string) => void): Promise<void> {
  const res = await logout().catch(() => null);
  if (!res?.ok) {
    onError?.("Đăng xuất chưa hoàn tất trên máy chủ. Bạn vẫn được chuyển về trang đăng nhập.");
    await new Promise((resolve) => setTimeout(resolve, 1500));
  }
  window.location.assign(loginPath);
}

export async function getProfile(): Promise<UserProfile> {
  const res = await apiFetch("/api/auth/me");
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new FetchError("Không thể tải thông tin hồ sơ", res.status, errorData, res.headers.get("retry-after"));
  }
  return res.json();
}

export function sanitizeRedirectUrl(redirect: string | null | undefined, fallback = "/"): string {
  if (!redirect) return fallback;
  const trimmed = redirect.trim();
  if (
    trimmed.startsWith("/") &&
    !trimmed.startsWith("//") &&
    !trimmed.startsWith("/\\") &&
    !trimmed.includes("://") &&
    !trimmed.includes(":\\")
  ) {
    return trimmed;
  }
  return fallback;
}

export function sanitizeNextUrl(next: string | null | undefined): string {
  return sanitizeRedirectUrl(next, "/dashboard");
}
