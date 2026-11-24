"use client";

import useSWR from "swr";
import { getAllAgreements } from "@/lib/api/supplier-agreements";

export function useSupplierPriceLines(supplierId: string, enabled: boolean) {
  const { data, error, mutate } = useSWR(enabled ? ["supplier-price-lines", supplierId] : null, () => getAllAgreements(supplierId), { revalidateOnFocus: false });
  return { data, error, reload: () => void mutate() };
}
