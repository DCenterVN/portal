"use client";

import useSWR from "swr";
import { companyMemberships, companyRoles, type Membership } from "@/lib/api/platform-client";

const PAGE = 20;

async function allMemberships(): Promise<Membership[]> {
  const all: Membership[] = [];
  for (let page = 1; ; page += 1) {
    const { items, limit } = await companyMemberships(page);
    all.push(...items);
    if (items.length < Math.min(limit, PAGE)) return all;
  }
}

export function useMemberships(enabled: boolean) {
  return useSWR(enabled ? "role-holders" : null, allMemberships, { revalidateOnFocus: false });
}

export function useRoleCatalog(enabled = true) {
  return useSWR(enabled ? "role-catalog" : null, companyRoles, { revalidateOnFocus: false });
}
