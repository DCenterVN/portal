"use client";

import { useSupplierAgreements, type SupplierAgreementsOptions } from "./use-supplier-agreements";
import { SupplierAgreementsView } from "./supplier-agreements-view";

export function SupplierAgreementsContainer(props: SupplierAgreementsOptions) {
  return <SupplierAgreementsView {...useSupplierAgreements(props)} />;
}
