"use client";

import { SupplierForm } from "./supplier-form";
import { useSupplierForm, type SupplierFormOptions } from "./use-supplier-form";

export function SupplierFormContainer(options: SupplierFormOptions) {
  const form = useSupplierForm(options);
  return <SupplierForm form={form} edit={Boolean(options.supplier)} onDiscard={options.onClose} />;
}
