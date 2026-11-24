"use client";

import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/patterns/form-field";
import { SupplierPhoto } from "./supplier-detail-view";
import type { useSupplierForm } from "./use-supplier-form";

type SupplierPhotoFieldProps = { form: ReturnType<typeof useSupplierForm>; name: string; currentUrl?: string };
export function SupplierPhotoField({ form, name, currentUrl = "" }: SupplierPhotoFieldProps) {
  const { t } = form;
  const input = useRef<HTMLInputElement>(null);
  const shown = form.photoPreview || currentUrl;
  return <fieldset disabled={form.busy || !form.photoAllowed} className="grid gap-3">
    <legend className="mb-2 font-semibold">{t("photo")}</legend>
    <Field label={t("photoChoose")} htmlFor="supplier-photo" hint={t("photoHint")} error={form.photoError || undefined}>
      <input ref={input} id="supplier-photo" className="sr-only" type="file" accept="image/jpeg,image/png,image/webp" onChange={event => {
        const file = event.target.files?.[0];
        if (file) form.choosePhoto(file);
        event.target.value = "";
      }} />
    </Field>
    <div className="flex flex-wrap items-center gap-3">
      <SupplierPhoto name={name} url={shown} onError={() => {}} />
      <Button type="button" variant="outline" onClick={() => input.current?.click()}>{shown ? t("photoChange") : t("photoPick")}</Button>
      {(form.photo || form.photoError) && <Button type="button" variant="ghost" onClick={() => form.choosePhoto(null)}>{t("photoRemove")}</Button>}
    </div>
  </fieldset>;
}
