"use client";

import { SupplierForm, type FormLayout } from "./supplier-form";
import { useSupplierForm, type SupplierFormOptions } from "./use-supplier-form";

export function SupplierFormContainer({ layout, ...options }: SupplierFormOptions & { layout?: FormLayout }) {
  const form = useSupplierForm(options);
  return <SupplierForm form={form} edit={Boolean(options.supplier)} name={form.values.name || options.supplier?.name || ""} currentPhotoUrl={options.photoUrl} onDiscard={options.onClose} layout={layout} />;
}
