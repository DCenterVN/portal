"use client";

import { createContext, useContext } from "react";
import type { Supplier } from "@/lib/api/suppliers";

export type SupplierProfile = { supplier: Supplier; photoUrl: string; canUpdate: boolean; reload: () => void; setSupplier: (supplier: Supplier) => void };
const SupplierProfileContext = createContext<SupplierProfile | null>(null);
export const SupplierProfileProvider = SupplierProfileContext.Provider;
export function useSupplierProfile(): SupplierProfile {
  const value = useContext(SupplierProfileContext);
  if (!value) throw new Error("useSupplierProfile cần nằm trong hồ sơ nhà cung cấp");
  return value;
}
