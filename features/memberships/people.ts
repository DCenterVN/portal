import type { Branch } from "@/lib/api/branches-client";
import type { Membership } from "@/lib/api/platform-client";
import { branchLabel } from "@/lib/branch-label";
import { plain } from "@/lib/permission-labels";

export type Assignment = { membershipId?: string; branchId: string; roles: string[]; locked: boolean };
export type Person = { userId: string; name: string; email: string; allBranches: boolean; flagMembershipId?: string; assignments: (Assignment & { branchName: string })[] };

export type Change =
  | { kind: "create"; branchId: string; roles: string[] }
  | { kind: "roles"; branchId: string; membershipId: string; roles: string[] }
  | { kind: "lock"; branchId: string; membershipId: string; locked: boolean }
  | { kind: "all_branches"; branchId: string; membershipId: string; value: boolean }
  | { kind: "delete"; branchId: string; membershipId: string };

export function groupByPerson(members: readonly Membership[], branches: readonly Branch[] = []): Person[] {
  const central = new Set(branches.filter((branch) => branch.type === "CENTRAL_KITCHEN").map((branch) => branch.id));
  const known = new Map(branches.map((branch) => [branch.id, branch]));
  const people = new Map<string, Person>();
  for (const member of members) {
    const person = people.get(member.user_id) ?? { userId: member.user_id, name: member.display_name || member.email, email: member.email, allBranches: false, assignments: [] };
    person.assignments.push({ membershipId: member.id, branchId: member.branch_id, branchName: known.has(member.branch_id) ? branchLabel(known.get(member.branch_id)!) : member.branch_name, roles: member.role_codes, locked: member.status === "SUSPENDED" });
    if (member.all_branches) {
      person.allBranches = true;
      person.flagMembershipId = member.id;
    } else if (!person.allBranches && (!person.flagMembershipId || central.has(member.branch_id))) {
      person.flagMembershipId = member.id;
    }
    people.set(member.user_id, person);
  }
  return [...people.values()].sort((left, right) => left.name.localeCompare(right.name, "vi"));
}

export function filterPeople(people: readonly Person[], branchId: string, query: string): Person[] {
  const needle = plain(query.trim());
  return people.filter((person) =>
    (!branchId || person.assignments.some((item) => item.branchId === branchId)) &&
    plain(`${person.name} ${person.email}`).includes(needle));
}

const same = (left: readonly string[], right: readonly string[]) => left.length === right.length && [...left].sort().join() === [...right].sort().join();

export function diffAssignments(original: Person, draft: readonly Assignment[], allBranches: boolean): Change[] {
  const kept = new Set(draft.map((row) => row.membershipId).filter(Boolean));
  const changes: Change[] = [];
  for (const row of draft) {
    const before = original.assignments.find((item) => item.membershipId === row.membershipId);
    if (!row.membershipId || !before) changes.push({ kind: "create", branchId: row.branchId, roles: row.roles });
    else {
      if (!same(before.roles, row.roles)) changes.push({ kind: "roles", branchId: row.branchId, membershipId: row.membershipId, roles: row.roles });
      if (before.locked !== row.locked) changes.push({ kind: "lock", branchId: row.branchId, membershipId: row.membershipId, locked: row.locked });
    }
  }
  if (allBranches !== original.allBranches && original.flagMembershipId && kept.has(original.flagMembershipId)) {
    const home = original.assignments.find((item) => item.membershipId === original.flagMembershipId);
    if (home) changes.push({ kind: "all_branches", branchId: home.branchId, membershipId: original.flagMembershipId, value: allBranches });
  }
  for (const item of original.assignments) {
    if (item.membershipId && !kept.has(item.membershipId)) changes.push({ kind: "delete", branchId: item.branchId, membershipId: item.membershipId });
  }
  return changes;
}

export function countHolders(members: readonly Membership[], role: string): number {
  return new Set(members.filter((member) => member.role_codes.includes(role as Membership["role_codes"][number])).map((member) => member.user_id)).size;
}

export function holdingPeople(members: readonly Membership[], role: string): Person[] {
  return groupByPerson(members.filter((member) => member.role_codes.includes(role as Membership["role_codes"][number])));
}
