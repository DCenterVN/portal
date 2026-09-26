import { apiFetch } from "../fetcher";

export interface UserProjection {
  id: string;
  email: string;
  phone: string;
  display_name: string;
  status: string;
}

export interface LoginResponse {
  expires_in: number;
  user: UserProjection;
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

export async function login(email: string, password: string): Promise<LoginResponse> {
  const res = await apiFetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || data.error || "Đăng nhập thất bại");
  }
  return data;
}

export async function register(email: string, phone: string, displayName: string, password: string): Promise<void> {
  const res = await apiFetch("/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, phone, display_name: displayName, password }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || data.error || "Đăng ký thất bại");
  }
}

export async function activateAccount(token: string): Promise<void> {
  const res = await apiFetch("/api/auth/activate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || data.error || "Kích hoạt tài khoản thất bại");
  }
}

export async function resendActivation(email: string): Promise<void> {
  const res = await apiFetch("/api/auth/activate/resend", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message || data.error || "Không gửi lại được liên kết kích hoạt");
  }
}

export async function forgotPassword(email: string): Promise<string> {
  const res = await apiFetch("/api/auth/forgot", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });

  const data = await res.json();
  return data.message || "Yêu cầu đã được tiếp nhận.";
}

export async function resetPassword(token: string, newPassword: string): Promise<string> {
  const res = await apiFetch("/api/auth/reset", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token, new_password: newPassword }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || data.error || "Đặt lại mật khẩu thất bại");
  }
  return data.message || "Đặt lại mật khẩu thành công.";
}

export async function logout(): Promise<void> {
  await apiFetch("/api/auth/logout", { method: "POST" });
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

export async function switchOrg(orgId: string, branchId?: string): Promise<Record<string, unknown>> {
  const res = await apiFetch("/api/auth/switch-org", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ org_id: orgId, branch_id: branchId }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || data.error || "Không thể chuyển ngữ cảnh");
  }
  return data;
}

export const switchBranch = switchOrg;

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
