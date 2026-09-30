"use client";

export { onboardCompany } from "@/lib/api/platform-client";
import useSWR from "swr";
import { listCompanies } from "@/lib/api/platform-client";
import type { OnboardCompany } from "@/lib/api/platform-contract";

export const OPTIONAL_MODULES = [
  { code: "SALES", label: "Bán hàng" },
  { code: "INVENTORY", label: "Kho" },
  { code: "PRODUCTION", label: "Sản xuất" },
  { code: "CUSTOMER", label: "Khách hàng" },
] as const;

export function pageParam(value: string | null): number {
  const page = Number(value);
  return Number.isInteger(page) && page > 0 ? page : 1;
}

export function useCompanies(page = 1, limit = 20) {
  return useSWR(["platform-companies", page, limit], () => listCompanies(page, limit), { revalidateOnFocus: false });
}

export type OnboardErrors = Partial<Record<keyof OnboardCompany, string>>;
const email = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Only checks the UI can know for sure; everything else is the backend's 400.
export function readOnboard(form: FormData): { input: OnboardCompany; errors: OnboardErrors } {
  const text = (name: string) => String(form.get(name) ?? "").trim();
  const known = new Set<string>(OPTIONAL_MODULES.map((item) => item.code));
  const input: OnboardCompany = {
    name: text("name"),
    code: text("code"),
    contract_ref: text("contract_ref"),
    owner_email: text("owner_email"),
    owner_display_name: text("owner_display_name"),
    modules: form.getAll("modules").map(String).filter((item) => known.has(item)),
  };
  const errors: OnboardErrors = {};
  if (!input.name) errors.name = "Nhập tên công ty.";
  if (!input.code) errors.code = "Nhập mã công ty.";
  if (!input.contract_ref) errors.contract_ref = "Bắt buộc có mã hợp đồng.";
  if (!email.test(input.owner_email)) errors.owner_email = "Email OWNER không hợp lệ.";
  if (!input.owner_display_name) errors.owner_display_name = "Nhập tên OWNER.";
  else if (input.owner_display_name.length > 50) errors.owner_display_name = "Tên OWNER tối đa 50 ký tự.";
  return { input, errors };
}
