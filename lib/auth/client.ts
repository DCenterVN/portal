import { apiFetch } from "../fetcher";

export interface UserProjection {
  id: string;
  email: string;
  phone: string;
  display_name: string;
  status: string;
}

export interface UserProfile {
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
    const message = errorData.message || (res.status === 401 ? "Phiên làm việc hết hạn" : "Không thể tải thông tin hồ sơ");
    const err = new Error(message);
    (err as unknown as { status?: number }).status = res.status;
    throw err;
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
