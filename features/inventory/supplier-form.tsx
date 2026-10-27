"use client";

import type { ChangeEvent } from "react";
import { Button } from "@/components/ui/button";
import { Field, TextInput, Textarea } from "@/components/ui/field";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, ConfirmDialog } from "@/components/ui/dialog";
import { EmptyState, ErrorState, Skeleton } from "@/components/ui/state";
import { SupplierCategoryPicker } from "./supplier-category-picker";
import { SupplierPhotoField } from "./supplier-photo-field";
import { supplierFieldLimits, type useSupplierForm, type SupplierFormField } from "./use-supplier-form";

type SupplierProfileFieldProps = { form: ReturnType<typeof useSupplierForm>; field: SupplierFormField; label: string; edit?: boolean };
function SupplierProfileField({ form, field, label, edit }: SupplierProfileFieldProps) {
  const props = {
    id: `supplier-${field}`, value: form.values[field], maxLength: supplierFieldLimits[field],
    disabled: form.busy || form.photoPending || (field === "code" && edit),
    onChange: (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => form.change(field, event.target.value),
    onBlur: () => form.touch(field),
  };
  return <Field label={label} htmlFor={props.id} error={form.fieldError(field)} hint={field === "code" ? form.t("codeHint") : undefined}>
    {field === "note" ? <Textarea {...props} /> : <TextInput {...props} autoFocus={field === "name"} required={field === "code" || field === "name"} type={field === "email" ? "email" : field === "phone" ? "tel" : "text"} />}
  </Field>;
}

type SupplierFormProps = { form: ReturnType<typeof useSupplierForm>; edit: boolean; onDiscard: () => void };
export function SupplierForm({ form, edit, onDiscard }: SupplierFormProps) {
  const { t } = form;
  return <>
    <Dialog open onOpenChange={open => { if (!open) form.close(); }}>
      <DialogContent variant="sheet" className="fixed inset-y-0 right-0 flex max-w-md flex-col overflow-hidden rounded-none">
        <DialogHeader className="shrink-0">
          <DialogTitle>{t(edit ? "edit" : "create")}</DialogTitle>
          <DialogDescription>{t("description")}</DialogDescription>
          {form.dirty && <p role="status" className="text-xs text-fg-3">{t("unsaved")}</p>}
        </DialogHeader>
        {!form.allowed ? <ErrorState denied title={t("denied")} /> : <form onSubmit={form.submit} noValidate className="flex min-h-0 flex-1 flex-col">
          <div className="grid flex-1 gap-6 overflow-y-auto pb-4 pr-1">
          <SupplierPhotoField form={form} />
          <fieldset className="grid gap-4 border-b border-line pb-6">
            <legend className="mb-2 font-semibold">{t("general")}</legend>
            <p className="text-xs text-fg-3">{t("generalHint")}</p>
            <SupplierProfileField form={form} field="name" label={t("name")} />
            <SupplierProfileField form={form} field="code" label={t("code")} edit={edit} />
            <SupplierProfileField form={form} field="tax" label={t("tax")} />
          </fieldset>
          <fieldset className="grid gap-4 border-b border-line pb-6">
            <legend className="mb-2 font-semibold">{t("address")}</legend>
            <p className="text-xs text-fg-3">{t("addressHint")}</p>
            <SupplierProfileField form={form} field="line" label={t("line")} />
            <SupplierProfileField form={form} field="province" label={t("province")} />
            <SupplierProfileField form={form} field="ward" label={t("ward")} />
          </fieldset>
          <fieldset className="grid gap-4 border-b border-line pb-6">
            <legend className="mb-2 font-semibold">{t("contact")}</legend>
            <p className="text-xs text-fg-3">{t("contactHint")}</p>
            <SupplierProfileField form={form} field="contactName" label={t("contactName")} />
            <SupplierProfileField form={form} field="phone" label={t("phone")} />
            <SupplierProfileField form={form} field="email" label={t("email")} />
          </fieldset>
          <fieldset disabled={form.busy || form.photoPending} className="grid gap-3">
            <legend className="mb-2 font-semibold">{t("groups")}</legend>
            <p className="text-xs text-fg-3">{t("groupsHint")}</p>
            {form.legacy && <p role="status" className="rounded-lg border border-line p-3 text-sm">{t("legacy")}. {t("legacyHint")}</p>}
            {form.lookupError ? <ErrorState title={t("loadError")} onRetry={form.retry} /> : form.categories === null ? <Skeleton title={t("loading")} /> : form.categories.length === 0 ? <EmptyState title={t("empty")} /> : <SupplierCategoryPicker categories={form.categories} selected={form.selected} onChange={form.select} disabled={form.busy} />}
          </fieldset>
          <details className="rounded-lg border border-line p-4">
            <summary className="cursor-pointer font-semibold">{t("note")}</summary>
            <div className="mt-3"><SupplierProfileField form={form} field="note" label={t("note")} /></div>
          </details>
          </div>
          {form.error && <p role="alert" className="text-sm text-danger">{form.error}</p>}
          <DialogFooter className="mt-0 shrink-0 flex-col bg-l1 sm:flex-col sm:space-x-0">
            {!form.valid && <p className="mb-2 text-xs text-fg-3">{form.missing}</p>}
            <Button type="button" variant="outline" className="w-full" disabled={form.busy} onClick={form.close}>{t("cancel")}</Button>
            <Button type="submit" className="w-full" disabled={!form.valid || form.busy}>{t(form.busy ? "saving" : form.photoPending ? "photoRetry" : "save")}</Button>
          </DialogFooter>
        </form>}
      </DialogContent>
    </Dialog>
    <ConfirmDialog open={form.discard} onOpenChange={form.setDiscard} title={t("discardTitle")} description={t("discardHint")} confirmLabel={t("discard")} onConfirm={onDiscard} />
  </>;
}
