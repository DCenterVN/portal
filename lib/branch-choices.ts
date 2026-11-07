import type { BranchChoice } from "@/lib/branch-label";

export const BRANCH_SEARCH_FROM = 8;

const objectValue = (value: unknown): Record<string, unknown> | null =>
  typeof value === "object" && value !== null ? value as Record<string, unknown> : null;

function parse(value: unknown): BranchChoice | null {
  const item = objectValue(value);
  if (typeof item?.branch_id !== "string" || typeof item.branch_name !== "string") return null;
  if (item.branch_type !== "CENTRAL_KITCHEN" && item.branch_type !== "STORE") return null;
  if (item.branch_status === "CLOSED") return null;
  const roles = Array.isArray(item.roles) ? item.roles.filter((role): role is string => typeof role === "string") : [];
  const org = typeof item.org_name === "string" ? item.org_name : undefined;
  const code = typeof item.branch_code === "string" && item.branch_code ? item.branch_code : undefined;
  return { id: item.branch_id, name: item.branch_name, type: item.branch_type, status: item.branch_status === "SUSPENDED" ? "SUSPENDED" : "ACTIVE", roles, org, code };
}

export function branchChoices(contexts: unknown[]): BranchChoice[] {
  const byId = new Map<string, BranchChoice>();
  for (const choice of contexts.map(parse)) {
    if (!choice) continue;
    const known = byId.get(choice.id);
    byId.set(choice.id, known ? { ...known, roles: [...new Set([...(known.roles ?? []), ...(choice.roles ?? [])])] } : choice);
  }
  const rank = (choice: BranchChoice) => (choice.type === "CENTRAL_KITCHEN" ? 0 : 1);
  return [...byId.values()].sort((left, right) => rank(left) - rank(right) || left.name.localeCompare(right.name, "vi"));
}
