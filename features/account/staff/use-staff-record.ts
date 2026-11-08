"use client";

import { useAccess } from "@/lib/access-boundary";
import { useRecordTab } from "@/lib/use-record-tab";
import type { UserProfile } from "@/lib/auth/client";
import { formatDate } from "@/lib/format-date";

export function useStaffRecord(profile: UserProfile) {
  const { scope } = useAccess();
  const tab = useRecordTab(["info", "roles", "security"]);
  const current = profile.memberships.find((member) => member.branch_id === scope?.branchId);
  const roles = [...new Set(profile.memberships.flatMap((member) => member.roles))];
  const joined = formatDate(profile.created_at);
  return { branchName: scope?.branchName || current?.branch_name, roles, joined, editTarget: tab.editTarget, edit: () => tab.edit("info") };
}
