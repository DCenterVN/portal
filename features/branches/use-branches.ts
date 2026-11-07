"use client";

import useSWR from "swr";
import { companyBranches, type Branch } from "@/lib/api/branches-client";
import type { Membership } from "@/lib/api/platform-client";
import { plain } from "@/lib/permission-labels";
import { useMemberships } from "@/features/roles/use-roles";

const STATUS_RANK: Record<Branch["status"], number> = { ACTIVE: 0, SUSPENDED: 1, CLOSED: 2 };

export function orderBranches(branches: readonly Branch[]): Branch[] {
  const rank = (branch: Branch) => (branch.type === "CENTRAL_KITCHEN" ? -1 : STATUS_RANK[branch.status]);
  return [...branches].sort((left, right) => rank(left) - rank(right) || left.name.localeCompare(right.name, "vi"));
}

export function useBranches(enabled: boolean) {
  return useSWR(enabled ? "company-branches" : null, async () => orderBranches(await companyBranches()), { revalidateOnFocus: false });
}

export function useBranchStaff(enabled: boolean, branchId: string) {
  const all = useMemberships(enabled);
  return { ...all, staff: all.data?.filter((member) => member.branch_id === branchId) };
}

export type Person = { userId: string; name: string; email: string; branches: string[] };

export function candidatePeople(members: readonly Membership[], branchId: string, query: string): Person[] {
  const here = new Set(members.filter((member) => member.branch_id === branchId).map((member) => member.user_id));
  const people = new Map<string, Person>();
  for (const member of members) {
    if (here.has(member.user_id) || member.all_branches || !member.email) continue;
    const person = people.get(member.user_id) ?? { userId: member.user_id, name: member.display_name || member.email, email: member.email, branches: [] };
    person.branches.push(member.branch_name);
    people.set(member.user_id, person);
  }
  const needle = plain(query.trim());
  return [...people.values()].filter((person) => plain(`${person.name} ${person.email}`).includes(needle));
}

export const BRANCH_STATUS: Record<Branch["status"], { label: string; tone: "success" | "warning" | "neutral" }> = {
  ACTIVE: { label: "Đang hoạt động", tone: "success" },
  SUSPENDED: { label: "Tạm ngừng", tone: "warning" },
  CLOSED: { label: "Đã đóng", tone: "neutral" },
};
