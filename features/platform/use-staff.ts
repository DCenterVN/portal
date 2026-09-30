"use client";

export { grantStaff, revokeStaff } from "@/lib/api/platform-client";
export type { PlatformStaff } from "@/lib/api/platform-contract";
import useSWR from "swr";
import { listStaff } from "@/lib/api/platform-client";

export const LAST_ADMIN_CONFLICT = "Không thể thu hồi quản trị viên nền tảng cuối cùng.";
export const ALREADY_STAFF_CONFLICT = "Người dùng này đã là nhân sự nền tảng.";
// Form values the backend accepts; not used to decide what the viewer may do.
export const STAFF_ROLES = [
  { code: "PLATFORM_SUPPORT", label: "Hỗ trợ nền tảng" },
  { code: "PLATFORM_ADMIN", label: "Quản trị nền tảng" },
] as const;

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function useStaff(page: number) {
  return useSWR(["platform-staff", page], () => listStaff(page, 20), { revalidateOnFocus: false });
}

export function readStaffGrant(form: FormData): { input?: { userId: string; role: string }; error?: string; field?: "user_id" | "role" } {
  const userId = String(form.get("user_id") ?? "").trim();
  const role = String(form.get("role") ?? "");
  if (!uuid.test(userId)) return { error: "User ID phải là UUID của tài khoản auth có sẵn.", field: "user_id" };
  if (!STAFF_ROLES.some((item) => item.code === role)) return { error: "Chọn vai trò nền tảng.", field: "role" };
  return { input: { userId, role } };
}
