import type { RoleCatalogItem } from "@/lib/api/platform-client";
import { roleName } from "@/lib/permission-labels";

export const ROLE_SEARCH_FROM = 8;

export type RoleOption = { code: string; name: string; job?: string; protected: boolean };

const fits = (role: RoleCatalogItem, branchType: string | undefined) => branchType !== undefined && role.branch_types.includes(branchType);

export function roleOptionsFor(catalog: readonly RoleCatalogItem[], branchType: string | undefined, held: readonly string[] = []): RoleOption[] {
  return catalog
    .filter((role) => fits(role, branchType) || held.includes(role.code))
    .map((role) => ({ code: role.code, name: role.name, job: role.description || undefined, protected: role.protected }));
}

export function catalogRoleName(catalog: readonly RoleCatalogItem[] | undefined, code: string): string {
  return catalog?.find((role) => role.code === code)?.name ?? roleName(code);
}

export function keepFitting(catalog: readonly RoleCatalogItem[], branchType: string | undefined, selected: readonly string[]): string[] {
  return selected.filter((code) => catalog.some((role) => role.code === code && fits(role, branchType)));
}
