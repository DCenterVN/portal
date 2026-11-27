"use client";

import useSWR from "swr";
import { getAgreementVersions } from "@/lib/api/supplier-agreements";

export function useSupplierPriceVersions(supplierId: string, agreementId: string, enabled: boolean) {
  const { data, error, mutate } = useSWR(enabled ? ["supplier-price-versions", supplierId, agreementId] : null, () => getAgreementVersions(supplierId, agreementId), { revalidateOnFocus: false });
  const versions = data ? [...data.items].sort((a, b) => b.version - a.version) : undefined;
  return { versions, error, reload: () => void mutate() };
}
