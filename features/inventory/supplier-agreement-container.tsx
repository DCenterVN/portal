"use client";

import { useSupplierAgreement, type SupplierAgreementOptions } from "./use-supplier-agreement";
import { SupplierAgreementForm } from "./supplier-agreement-form";

export function SupplierAgreementContainer(props: SupplierAgreementOptions) {
  return <SupplierAgreementForm {...useSupplierAgreement(props)} />;
}
