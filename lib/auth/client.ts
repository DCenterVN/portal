import {getAccountProfile} from "../api/account-client";
import type {UserProfileResponse} from "../api/auth/types";
import { apiFetch } from "../fetcher";

export interface UserProjection {
  id: string;
  email: string;
  phone: string;
  display_name: string;
  status: string;
}

export interface UserProfile extends Omit<UserProfileResponse, "avatar_key" | "avatar_url"> {
  avatar_key?: string | null;
  avatar_url?: string | null;
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

export function getProfile(): Promise<UserProfile> {
  return getAccountProfile();
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
