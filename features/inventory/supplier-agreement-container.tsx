"use client";

import { useSupplierAgreement, type SupplierAgreementOptions } from "./use-supplier-agreement";
import { SupplierAgreementForm } from "./supplier-agreement-form";

export function SupplierAgreementContainer({ layout, ...props }: SupplierAgreementOptions & { layout?: "sheet" | "page" }) {
  return <SupplierAgreementForm {...useSupplierAgreement(props)} layout={layout} />;
}
