import { describe, expect, it } from "vitest";
import type { Branch } from "@/lib/api/branches-client";
import type { Membership } from "@/lib/api/platform-client";
import { countHolders, diffAssignments, filterPeople, groupByPerson } from "./people";

const id = (n: number) => `0192f3a4-5b6c-7d8e-9f00-${String(n).padStart(12, "0")}`;
const member = (n: number, user: number, branch: number, roles: Membership["role_codes"], extra: Partial<Membership> = {}): Membership => ({
  id: id(n), user_id: id(user), branch_id: id(branch), role_codes: roles, status: "ACTIVE",
  display_name: `Người ${user}`, email: `u${user}@x.test`, branch_name: `CN ${branch}`, all_branches: false, ...extra,
});
const branches: Branch[] = [
  { id: id(1), code: "MAIN", name: "CN 1", type: "CENTRAL_KITCHEN", status: "ACTIVE", employee_count: 0 },
  { id: id(2), code: "A", name: "CN 2", type: "STORE", status: "ACTIVE", employee_count: 0 },
];
const rows = [member(1, 10, 1, ["WAREHOUSE"]), member(2, 10, 2, ["SALES"]), member(3, 11, 2, ["SALES", "WAREHOUSE"], { status: "SUSPENDED" })];

describe("groupByPerson", () => {
  it("merges memberships of one user and picks the central kitchen membership for the flag", () => {
    const people = groupByPerson([rows[1], rows[0], rows[2]], branches);
    expect(people).toHaveLength(2);
    expect(people[0].assignments.map((item) => item.branchId)).toEqual([id(2), id(1)]);
    expect(people[0].flagMembershipId).toBe(id(1));
    expect(people[1].assignments[0].locked).toBe(true);
  });
  it("marks a person with the all-branches flag", () => {
    const [person] = groupByPerson([member(1, 10, 1, ["ADMIN"], { all_branches: true })], branches);
    expect(person.allBranches).toBe(true);
    expect(person.flagMembershipId).toBe(id(1));
  });
});

describe("filterPeople", () => {
  const people = groupByPerson(rows, branches);
  it("filters by branch and by accent-free query", () => {
    expect(filterPeople(people, id(1), "")).toHaveLength(1);
    expect(filterPeople(people, "", "U11")).toHaveLength(1);
    expect(filterPeople(people, id(2), "")).toHaveLength(2);
  });
});

describe("diffAssignments", () => {
  const [person] = groupByPerson(rows, branches);
  const draft = () => person.assignments.map(({ branchName: _name, ...item }) => ({ ...item }));
  it("is empty when nothing changed", () => {
    expect(diffAssignments(person, draft(), false)).toEqual([]);
  });
  it("lists create, roles, lock, all_branches and delete", () => {
    const next = draft();
    next[0].roles = ["WAREHOUSE", "SALES"];
    next[1].locked = true;
    const changes = diffAssignments(person, [...next.slice(0, 2), { branchId: id(3), roles: ["SALES"], locked: false }], true);
    expect(changes.map((change) => change.kind)).toEqual(["roles", "lock", "create", "all_branches"]);
    expect(diffAssignments(person, [next[1]], false)).toEqual([{ kind: "lock", branchId: id(2), membershipId: id(2), locked: true }, { kind: "delete", branchId: id(1), membershipId: id(1) }]);
  });
});

describe("countHolders", () => {
  it("counts distinct people, not memberships", () => {
    const list = [member(1, 10, 1, ["SALES"]), member(2, 10, 2, ["SALES"]), member(3, 11, 2, ["SALES"]), member(4, 12, 2, ["WAREHOUSE"])];
    expect(countHolders(list, "SALES")).toBe(2);
    expect(countHolders(list, "WAREHOUSE")).toBe(1);
    expect(countHolders(list, "ADMIN")).toBe(0);
  });
});
