import {fetcher, mutationFetcher} from "@/lib/fetcher";
export interface EmployeeContext {org_id: string; branch_id: string; roles: string[]}
export function login(identifier: string, password: string, redirect?: string) {
 return mutationFetcher<{next_path: string}>("/api/auth/staff/login", {arg: {identifier, password, ...(redirect ? {redirect} : {})}});
}
export function acceptInvite(token: string, password: string) {
 return mutationFetcher<{status: string}>("/api/auth/staff/invite/accept", {arg: {token, password}});
}
export function listContexts() {return fetcher<EmployeeContext[]>("/api/auth/staff/switch-org");}
export function switchBranch(orgId: string, branchId: string) {
 return mutationFetcher<{next_path: string}>("/api/auth/staff/switch-branch", {arg: {org_id: orgId, branch_id: branchId}});
}
export function switchOrg(orgId: string, branchId: string) {
 return mutationFetcher<{next_path: string}>("/api/auth/staff/switch-org", {arg: {org_id: orgId, branch_id: branchId}});
}
