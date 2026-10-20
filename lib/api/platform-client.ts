import { z } from "zod";
import { fetcher } from "@/lib/fetcher";
import { auditSchema, decodePlatform, pageSchema, roleMatrixSchema, type AuditEntry, type Page, type RoleMatrix } from "./platform-contract";

function query(values: Record<string, string | undefined>) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(values)) if (value) params.set(key, value);
  return params.toString();
}
export async function companyRoleMatrix(root: string): Promise<RoleMatrix> {
  return decodePlatform(await companyCall<unknown>("company/role-matrix", root), roleMatrixSchema);
}
export async function replaceRole(root: string, role: string, actions: string[]): Promise<RoleMatrix> {
  const body = await companyCall<unknown>(`company/role-matrix/roles/${encodeURIComponent(role)}`, root, {
    method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify({ actions }),
  });
  return decodePlatform(body, roleMatrixSchema);
}
export async function companyAudit(root: string, filters: Record<string, string | undefined> = {}, page = 1): Promise<Page<AuditEntry>> {
  const path = `company/audit-logs?${query({ action: filters.action, since: filters.since, until: filters.until, page: String(page), limit: "20" })}`;
  return decodePlatform(await companyCall<unknown>(path, root), pageSchema(auditSchema));
}
export async function companyCall<T>(path: string, _root: string, init?: RequestInit): Promise<T> {
  return fetcher<T>(`/api/org/${path}`, init);
}

export const employeeRoles = ["ADMIN", "FOOD_DEV", "WAREHOUSE", "PROCESSING_STAFF", "SALES"] as const;
const membershipSchema = z.object({
  id: z.string().uuid(), user_id: z.string().uuid(), branch_id: z.string().uuid(),
  role_codes: z.array(z.enum(employeeRoles)).nullable().transform((roles) => roles ?? []),
  status: z.enum(["ACTIVE", "SUSPENDED"]),
});
export type Membership = z.infer<typeof membershipSchema>;
export async function companyMemberships(page: number) {
  return decodePlatform(await companyCall<unknown>(`company/memberships?page=${page}&limit=20`, ""), pageSchema(membershipSchema));
}
export async function createMembership(input: { email: string; display_name: string; role_codes: string[] }) {
  return decodePlatform(await companyCall<unknown>("company/memberships", "", {
    method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(input),
  }), membershipSchema);
}
export async function replaceMembershipRoles(id: string, role_codes: string[]) {
  return decodePlatform(await companyCall<unknown>(`company/memberships/${encodeURIComponent(id)}/roles`, "", {
    method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify({ role_codes }),
  }), z.object({ membership_id: z.string().uuid(), role_codes: z.array(z.enum(employeeRoles)).nullable() }));
}
export async function updateMembershipStatus(id: string, status: Membership["status"]) {
  return decodePlatform(await companyCall<unknown>(`company/memberships/${encodeURIComponent(id)}`, "", {
    method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ status }),
  }), z.object({ membership_id: z.string().uuid(), status: membershipSchema.shape.status }));
}
