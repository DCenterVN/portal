"use client";

import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import type { useSupplierForm } from "./use-supplier-form";

type SupplierPhotoFieldProps = { form: ReturnType<typeof useSupplierForm> };
export function SupplierPhotoField({ form }: SupplierPhotoFieldProps) {
  const { t } = form;
  return <fieldset disabled={form.busy || !form.photoAllowed} className="grid gap-3 border-b border-line pb-6">
    <legend className="mb-2 font-semibold">{t("photo")}</legend>
    <Field label={t("photoChoose")} htmlFor="supplier-photo" hint={t("photoHint")} error={form.photoError || undefined}>
      <input id="supplier-photo" type="file" accept="image/jpeg,image/png,image/webp" onChange={event => {
        const file = event.target.files?.[0];
        if (file) form.choosePhoto(file);
        event.target.value = "";
      }} />
    </Field>
    {form.photoPreview && <img src={form.photoPreview} alt={t("photoPreview")} className="size-24 rounded-lg object-cover" />}
    {(form.photo || form.photoError) && <Button type="button" variant="outline" onClick={() => form.choosePhoto(null)}>{t("photoRemove")}</Button>}
  </fieldset>;
}
