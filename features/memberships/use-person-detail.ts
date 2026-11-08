"use client";

import { useMemo } from "react";
import { useAccess } from "@/lib/access-boundary";
import { useBranches } from "@/features/branches/use-branches";
import { useMemberships } from "@/features/roles/use-roles";
import { groupByPerson } from "./people";
import { useRecordTab } from "@/lib/use-record-tab";

export function usePersonDetail(userId: string) {
  const { can, scope } = useAccess();
  const tab = useRecordTab(["assignments", "info"]);
  const members = useMemberships(can("org:membership:read"));
  const branches = useBranches(can("org:branch:read"));
  const person = useMemo(() => groupByPerson(members.data ?? [], branches.data ?? []).find((item) => item.userId === userId), [members.data, branches.data, userId]);
  return { members, branches, person, can, scope, editTarget: tab.editTarget, edit: () => tab.edit("assignments") };
}
