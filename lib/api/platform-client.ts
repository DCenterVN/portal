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
export async function companyCall<T>(path: string, root: string, init?: RequestInit): Promise<T> {
  const suffix = query({ org_id: root });
  return fetcher<T>(`/api/org/${path}${path.includes("?") ? "&" : "?"}${suffix}`, init);
}
