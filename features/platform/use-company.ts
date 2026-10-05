"use client";

export { setModule } from "@/lib/api/platform-client";
export type { CompanyModule } from "@/lib/api/platform-contract";
import useSWR from "swr";
import { companyModules, listModules } from "@/lib/api/platform-client";
import type { CompanyModule, ModuleChange } from "@/lib/api/platform-contract";

export type Source = "platform" | "company";

export function useModules(source: Source, root: string) {
  return useSWR(root ? ["modules", source, root] : null, () => (source === "platform" ? listModules(root) : companyModules(root)), { revalidateOnFocus: false });
}

export type ModuleView = "active" | "inactive" | "scheduled" | "expired" | "not_purchased";

// Display only: the backend decides access with DB time (spec step 3a).
export function moduleView(module: CompanyModule, now = new Date()): ModuleView {
  if (module.always_on) return "active";
  if (!module.status) return "not_purchased";
  if (module.status !== "ACTIVE") return "inactive";
  if (module.starts_at && new Date(module.starts_at) > now) return "scheduled";
  if (module.ends_at && new Date(module.ends_at) <= now) return "expired";
  return "active";
}

// Active or scheduled -> switch off (cancels a scheduled start); inactive, expired, never bought -> switch on.
export function nextModuleStatus(view: ModuleView): ModuleChange["status"] {
  return view === "active" || view === "scheduled" ? "INACTIVE" : "ACTIVE";
}

export function canToggle(module: CompanyModule): boolean {
  return !module.always_on && module.code !== "CORE";
}

// datetime-local (browser local time) -> RFC3339 UTC; "" = not given, null = unparseable.
function readTime(form: FormData, name: string): string | null {
  const local = String(form.get(name) ?? "").trim();
  if (!local) return "";
  const time = new Date(local);
  return Number.isNaN(time.getTime()) ? null : time.toISOString();
}

export function readModuleChange(form: FormData, status: ModuleChange["status"]): { change?: ModuleChange; error?: string } {
  const contractRef = String(form.get("contract_ref") ?? "").trim();
  if (!contractRef) return { error: "Bắt buộc có mã hợp đồng." };
  const starts = readTime(form, "starts_at");
  const ends = readTime(form, "ends_at");
  if (starts === null) return { error: "Ngày bắt đầu không hợp lệ." };
  if (ends === null) return { error: "Ngày kết thúc không hợp lệ." };
  if (starts && ends && starts >= ends) return { error: "Ngày kết thúc phải sau ngày bắt đầu." };
  const change: ModuleChange = { status, contract_ref: contractRef };
  if (starts) change.starts_at = starts;
  if (ends) change.ends_at = ends;
  return { change };
}
