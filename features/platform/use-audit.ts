"use client";

export type { AuditEntry } from "@/lib/api/platform-contract";
import useSWR from "swr";
import { companyAudit, platformAudit } from "@/lib/api/platform-client";
import type { Source } from "./use-company";

export type AuditFilters = { root_branch_id?: string; action?: string; since?: string; until?: string };

export function useAudit(source: Source, root: string, filters: AuditFilters, page: number) {
  const key = source === "company" && !root ? null : ["audit", source, root, JSON.stringify(filters), page];
  return useSWR(key, () => (source === "platform" ? platformAudit(filters, page) : companyAudit(root, filters, page)), { revalidateOnFocus: false });
}

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function instant(value: string): string | undefined | null {
  if (!value) return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

// datetime-local → RFC3339 (org parses since/until with time.RFC3339).
export function readAuditFilters(form: FormData, withRoot: boolean): { filters?: AuditFilters; error?: string } {
  const text = (name: string) => String(form.get(name) ?? "").trim();
  const root = withRoot ? text("root_branch_id") : "";
  if (root && !uuid.test(root)) return { error: "Mã MAIN phải là UUID." };
  const since = instant(text("since"));
  const until = instant(text("until"));
  if (since === null || until === null) return { error: "Thời gian không hợp lệ." };
  if (since && until && since > until) return { error: "“Từ” phải trước “Đến”." };
  const filters: AuditFilters = { root_branch_id: root || undefined, action: text("action") || undefined, since, until };
  return { filters: Object.fromEntries(Object.entries(filters).filter(([, value]) => value)) as AuditFilters };
}
