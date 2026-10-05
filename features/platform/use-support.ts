"use client";

export { breakGlass, requestSupport } from "@/lib/api/platform-client";
export type { SupportGrant, SupportRequest } from "@/lib/api/platform-contract";
import useSWR from "swr";
import { listCompanies, mySupport } from "@/lib/api/platform-client";
import type { SupportGrant, SupportRequest } from "@/lib/api/platform-contract";

export const BREAK_GLASS_CONFLICT = "Công ty đã dùng break-glass trong 24 giờ qua, hãy xin OWNER duyệt.";
export const BREAK_GLASS_HOURS = 4;

export function useMySupport(page: number) {
  return useSWR(["my-support", page], () => mySupport(page, 20), { revalidateOnFocus: true });
}

// ponytail: first 100 companies feed the picker; add a search box when a platform has more.
export function useCompanyOptions() {
  return useSWR(["platform-companies", 1, 100], () => listCompanies(1, 100), { revalidateOnFocus: false });
}

// Fail closed: after a failed revalidation SWR still holds the old list; never offer it.
export function usableCompanies<T>(result: { data?: { items: T[] }; error?: unknown }): T[] {
  return result.error ? [] : result.data?.items ?? [];
}

export type GrantState = "pending" | "active" | "expired" | "revoked";

// Display only. Whether a grant works is decided by org with DB time.
export function grantState(grant: SupportGrant, now = new Date()): GrantState {
  if (grant.revoked_at) return "revoked";
  if (!grant.starts_at) return "pending";
  if (grant.expires_at && new Date(grant.expires_at) <= now) return "expired";
  return "active";
}

export const grantLabels: Record<GrantState, { label: string; variant: "active" | "suspended" | "revoked" | "outline" }> = {
  pending: { label: "Chờ OWNER duyệt", variant: "suspended" },
  active: { label: "Đang hiệu lực", variant: "active" },
  expired: { label: "Hết hạn", variant: "outline" },
  revoked: { label: "Đã thu hồi", variant: "revoked" },
};

export function readSupport(form: FormData): { input?: SupportRequest; error?: string; field?: "root_branch_id" | "reason" } {
  const input = {
    root_branch_id: String(form.get("root_branch_id") ?? "").trim(),
    reason: String(form.get("reason") ?? "").trim(),
    ticket_ref: String(form.get("ticket_ref") ?? "").trim(),
  };
  if (!input.root_branch_id) return { error: "Chọn công ty cần hỗ trợ.", field: "root_branch_id" };
  if (!input.reason) return { error: "Bắt buộc nêu lý do.", field: "reason" };
  return { input };
}
