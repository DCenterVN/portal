import type { RoleCatalogItem } from "@/lib/api/platform-client";
import { ROLE_INFO } from "@/lib/permission-labels";

export const ROLE_SEARCH_FROM = 8;

export type RoleOption = { code: string; name: string; job?: string };

const fits = (role: RoleCatalogItem, branchType: string | undefined) => branchType !== undefined && role.branch_types.includes(branchType);

export function roleOptionsFor(catalog: readonly RoleCatalogItem[], branchType: string | undefined, held: readonly string[] = []): RoleOption[] {
  return catalog
    .filter((role) => fits(role, branchType) || held.includes(role.code))
    .map((role) => ({ code: role.code, name: role.name, job: ROLE_INFO[role.code]?.job }));
}

export function keepFitting(catalog: readonly RoleCatalogItem[], branchType: string | undefined, selected: readonly string[]): string[] {
  return selected.filter((code) => catalog.some((role) => role.code === code && fits(role, branchType)));
}
