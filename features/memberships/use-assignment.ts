"use client";

import { createMembership, deleteMembership, replaceMembershipRoles, updateMembership } from "@/lib/api/platform-client";
import { errorStatus } from "@/lib/access";
import type { Change, Person } from "./people";

const WRONG_ROLE = "Có vai trò không dùng được ở loại chi nhánh này. Hãy bỏ chọn vai trò đó rồi lưu lại.";

const FAILED: Record<Change["kind"], Record<number, string>> = {
  create: { 400: WRONG_ROLE, 409: "Người này đã có ở chi nhánh này.", 404: "Không tìm thấy chi nhánh hoặc tài khoản này." },
  roles: { 400: WRONG_ROLE, 409: "Không thể bỏ vai trò Quản trị của người cuối cùng.", 403: "Bạn không được đổi vai trò này." },
  lock: { 409: "Không thể khoá Quản trị cuối cùng.", 403: "Bạn không được khoá người này." },
  all_branches: { 403: "Chỉ Quản trị mới đổi được mục này." },
  delete: { 403: "Bạn không thể tự bỏ mình khỏi chi nhánh.", 409: "Đây là Quản trị cuối cùng, không thể bỏ." },
};

function run(person: Person, change: Change): Promise<unknown> {
  if (change.kind === "create") return createMembership({ user_id: person.userId, branch_id: change.branchId, role_codes: change.roles });
  if (change.kind === "roles") return replaceMembershipRoles(change.membershipId, change.roles);
  if (change.kind === "lock") return updateMembership(change.membershipId, { status: change.locked ? "SUSPENDED" : "ACTIVE" });
  if (change.kind === "all_branches") return updateMembership(change.membershipId, { all_branches: change.value });
  return deleteMembership(change.membershipId);
}

export async function applyChanges(person: Person, changes: readonly Change[]): Promise<Record<string, string>> {
  const errors: Record<string, string> = {};
  for (const change of changes) {
    try {
      await run(person, change);
    } catch (failed) {
      errors[change.branchId] ??= FAILED[change.kind][errorStatus(failed) ?? 0] ?? "Không lưu được. Hãy thử lại.";
    }
  }
  return errors;
}
