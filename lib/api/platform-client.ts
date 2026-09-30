import { fetcher } from "@/lib/fetcher";
import {
  auditSchema, companySchema, consentSchema, decodePlatform, modulesSchema,
  onboardResultSchema, pageSchema, platformMeSchema, roleMatrixSchema, staffSchema, supportGrantSchema,
  type AuditEntry, type Company, type CompanyModule, type ModuleChange, type OnboardCompany,
  type Page, type PlatformStaff, type RoleMatrix, type SupportGrant, type SupportRequest,
} from "./platform-contract";

async function platform<T>(path: string, schema: { parse(value: unknown): T }, init?: RequestInit): Promise<T> {
  const body: unknown = await fetcher<unknown>(`/api/platform/${path}`, init);
  return decodePlatform(body, schema);
}
function query(values: Record<string, string | undefined>) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(values)) if (value) params.set(key, value);
  return params.toString();
}
export const getPlatformMe = () => platform("me", platformMeSchema);
export const listCompanies = (page = 1, limit = 20) => platform<Page<Company>>(`companies?${query({ page: String(page), limit: String(limit) })}`, pageSchema(companySchema));
export const onboardCompany = (input: OnboardCompany, idempotencyKey: string) => platform("companies", onboardResultSchema, {
  method: "POST", headers: { "content-type": "application/json", "Idempotency-Key": idempotencyKey }, body: JSON.stringify(input),
});
export const listModules = (root: string) => platform<CompanyModule[]>(`companies/${encodeURIComponent(root)}/modules`, modulesSchema);
export const setModule = (root: string, code: string, input: ModuleChange) => platform<CompanyModule[]>(`companies/${encodeURIComponent(root)}/modules/${encodeURIComponent(code)}`, modulesSchema, {
  method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify(input),
});
export const getRoleMatrix = (root: string) => platform<RoleMatrix>(`companies/${encodeURIComponent(root)}/role-matrix`, roleMatrixSchema);
export const replaceRole = (root: string, role: string, actions: string[]) => platform<RoleMatrix>(`companies/${encodeURIComponent(root)}/role-matrix/roles/${encodeURIComponent(role)}`, roleMatrixSchema, {
  method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify({ actions }),
});
export const listStaff = (page = 1, limit = 20) => platform<Page<PlatformStaff>>(`staff?${query({ page: String(page), limit: String(limit) })}`, pageSchema(staffSchema));
export const grantStaff = (userId: string, role: string) => platform("staff", staffSchema, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ user_id: userId, role }) });
export const revokeStaff = (id: string) => platform(`staff/${encodeURIComponent(id)}/revoke`, staffSchema, { method: "POST" });
export const mySupport = (page = 1, limit = 20) => platform<Page<SupportGrant>>(`support-access?${query({ page: String(page), limit: String(limit) })}`, pageSchema(supportGrantSchema));
export const requestSupport = (input: SupportRequest) => platform("support-access", supportGrantSchema, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(input) });
export const breakGlass = (root: string, reason: string, ticket: string) => platform("support-access/break-glass", supportGrantSchema, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ root_branch_id: root, reason, ticket_ref: ticket }) });
export const platformAudit = (filters: Record<string, string | undefined>, page = 1, limit = 20) => platform<Page<AuditEntry>>(`audit-logs?${query({ ...filters, page: String(page), limit: String(limit) })}`, pageSchema(auditSchema));
export async function companyPermissions(root: string) {
  return fetcher<{ action_keys: string[] }>(`/api/org/permissions/me?${query({ org_id: root, branch_id: root })}`);
}
export async function companyModules(root: string): Promise<CompanyModule[]> {
  return decodePlatform(await companyCall<unknown>("company/modules", root), modulesSchema);
}
export async function companyRoleMatrix(root: string): Promise<RoleMatrix> {
  return decodePlatform(await companyCall<unknown>("company/role-matrix", root), roleMatrixSchema);
}
export async function companySupport(root: string, page = 1): Promise<Page<SupportGrant>> {
  return decodePlatform(await companyCall<unknown>(`company/support-access?page=${page}&limit=20`, root), pageSchema(supportGrantSchema));
}
export async function companyAudit(root: string, filters: Record<string, string | undefined> = {}, page = 1): Promise<Page<AuditEntry>> {
  const path = `company/audit-logs?${query({ action: filters.action, since: filters.since, until: filters.until, page: String(page), limit: "20" })}`;
  return decodePlatform(await companyCall<unknown>(path, root), pageSchema(auditSchema));
}
export async function decideCompanyGrant(root: string, grant: string, decision: "approve" | "revoke"): Promise<SupportGrant> {
  const body = await companyCall<unknown>(`support-access/${encodeURIComponent(grant)}/${decision}`, root, { method: "POST" });
  return decodePlatform(body, supportGrantSchema);
}
export async function companyCall<T>(path: string, root: string, init?: RequestInit): Promise<T> {
  const suffix = query({ org_id: root });
  return fetcher<T>(`/api/org/${path}${path.includes("?") ? "&" : "?"}${suffix}`, init);
}
export async function putConsent(root: string, value: boolean) {
  return fetcher<{ standing_support_consent: boolean }>(`/api/org/company/settings?${query({ org_id: root })}`, {
    method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify({ standing_support_consent: value }),
  }).then((body) => decodePlatform(body, consentSchema));
}
