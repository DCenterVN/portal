"use client";

import useSWR from "swr";
import { getContractMaterials } from "@/lib/api/supplier-agreements";
import type { Material } from "@/lib/api/sales";

export const CONTRACT_MATERIALS_KEY = "inbound-qc-materials";

let session: Promise<Material[]> | null = null;
export const loadContractMaterials = () => session ??= getContractMaterials().then(items => items.sort((a, b) => a.name.localeCompare(b.name, "vi"))).catch(cause => { session = null; throw cause; });

export function useContractMaterials(enabled = true) {
  const { data, error, mutate } = useSWR(enabled ? CONTRACT_MATERIALS_KEY : null, loadContractMaterials, { revalidateOnFocus: false, revalidateIfStale: false });
  return { materials: data ?? null, failed: Boolean(error), retry: () => void mutate() };
}
