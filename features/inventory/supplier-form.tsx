"use client";

import type { ChangeEvent } from "react";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/patterns/form-field";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from "@/components/ui/sheet";
import { PageHeading } from "@/components/patterns/page-heading";
import { ConfirmDialog } from "@/components/patterns/confirm-dialog";
import { EmptyState, ErrorState, LoadingState } from "@/components/patterns/empty-state";
import { SupplierCategoryPicker } from "./supplier-category-picker";
import { SupplierPhotoField } from "./supplier-photo-field";
import { supplierFieldLimits, type useSupplierForm, type SupplierFormField } from "./use-supplier-form";
import { InlineAlert } from "@/components/patterns/inline-alert";

type SupplierProfileFieldProps = { form: ReturnType<typeof useSupplierForm>; field: SupplierFormField; label: string; edit?: boolean };
function SupplierProfileField({ form, field, label, edit }: SupplierProfileFieldProps) {
  const props = {
    id: `supplier-${field}`, value: form.values[field], maxLength: supplierFieldLimits[field],
    disabled: form.busy || form.photoPending || (field === "code" && edit),
    onChange: (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => form.change(field, event.target.value),
    onBlur: () => form.touch(field),
  };
  return <Field label={label} htmlFor={props.id} error={form.fieldError(field)} hint={field === "code" ? form.t(edit ? "codeLocked" : "codeHint") : undefined}>
    {field === "note" ? <Textarea {...props} /> : <Input {...props} autoFocus={field === "name"} required={field === "code" || field === "name"} type={field === "email" ? "email" : field === "phone" ? "tel" : "text"} />}
  </Field>;
}

export type FormLayout = "sheet" | "page";
type SupplierFormProps = { form: ReturnType<typeof useSupplierForm>; edit: boolean; name: string; currentPhotoUrl?: string; onDiscard: () => void; layout?: FormLayout };
export function SupplierForm({ form, edit, name, currentPhotoUrl, onDiscard, layout = "sheet" }: SupplierFormProps) {
  const { t } = form;
  const page = layout === "page";
  const Footer = page ? "div" : SheetFooter;
  const body = <>
        {!form.allowed ? <ErrorState denied title={t("denied")} /> : <form onSubmit={form.submit} noValidate className={page ? "grid gap-6" : "flex min-h-0 flex-1 flex-col px-4"}>
          <div className={page ? "grid gap-6" : "grid flex-1 content-start gap-6 overflow-y-auto pb-4 pr-1"}>
          <fieldset className="grid gap-4 sm:grid-cols-2">
            <legend className="mb-2 font-semibold">{t("general")}</legend>
            <SupplierProfileField form={form} field="name" label={t("name")} />
            <SupplierProfileField form={form} field="code" label={t("code")} edit={edit} />
          </fieldset>
          <fieldset disabled={form.busy || form.photoPending} className="grid gap-3">
            <legend className="mb-2 font-semibold">{t("groups")}</legend>
            <p className="text-xs text-muted-foreground">{t("groupsHint")}</p>
            {form.legacy && <p role="status" className="rounded-lg bg-tint p-3 text-sm">{t("legacy")}. {t("legacyHint")}</p>}
            {form.lookupError ? <ErrorState title={t("loadError")} onRetry={form.retry} /> : form.categories === null ? <LoadingState title={t("loading")} /> : form.categories.length === 0 ? <EmptyState title={t("empty")} /> : <SupplierCategoryPicker categories={form.categories} selected={form.selected} onChange={form.select} disabled={form.busy} />}
          </fieldset>
          <fieldset className="grid gap-4 sm:grid-cols-2">
            <legend className="mb-2 font-semibold">{t("contactAddress")}</legend>
            <SupplierProfileField form={form} field="tax" label={t("tax")} />
            <SupplierProfileField form={form} field="contactName" label={t("contactName")} />
            <SupplierProfileField form={form} field="phone" label={t("phone")} />
            <SupplierProfileField form={form} field="email" label={t("email")} />
            <SupplierProfileField form={form} field="line" label={t("line")} />
            <SupplierProfileField form={form} field="ward" label={t("ward")} />
            <SupplierProfileField form={form} field="province" label={t("province")} />
          </fieldset>
          <SupplierPhotoField form={form} name={name} currentUrl={currentPhotoUrl} />
          <SupplierProfileField form={form} field="note" label={t("note")} />
          </div>
          {form.error && <InlineAlert>{form.error}</InlineAlert>}
          <Footer className={page ? "flex flex-col-reverse gap-2 sm:flex-row sm:justify-end" : "shrink-0 flex-col-reverse bg-background px-0 sm:flex-row sm:justify-end"}>
            <Button type="button" variant="outline" className="w-full sm:w-auto" disabled={form.busy} onClick={form.close}>{t("cancel")}</Button>
            <Button type="submit" className="w-full sm:w-auto" disabled={!form.ready || form.busy}>{t(form.busy ? "saving" : form.photoPending ? "photoRetry" : "save")}</Button>
          </Footer>
        </form>}
  </>;
  return <>
    {page ? <section className="mt-6 grid max-w-3xl gap-4" aria-label={t(edit ? "edit" : "create")}>
      <PageHeading title={t(edit ? "edit" : "create")} description={t("description")} badge={form.dirty ? <span role="status" className="text-xs text-muted-foreground">{t("unsaved")}</span> : undefined} />
      {body}
    </section> : <Sheet open onOpenChange={open => { if (!open) form.close(); }}>
      <SheetContent className="overflow-hidden sm:max-w-2xl">
        <SheetHeader className="shrink-0">
          <SheetTitle>{t(edit ? "edit" : "create")}</SheetTitle>
          <SheetDescription>{t("description")}</SheetDescription>
          {form.dirty && <p role="status" className="text-xs text-muted-foreground">{t("unsaved")}</p>}
        </SheetHeader>
        {body}
      </SheetContent>
    </Sheet>}
    <ConfirmDialog open={form.discard} onOpenChange={form.setDiscard} title={t("discardTitle")} description={t("discardHint")} confirmLabel={t("discard")} onConfirm={onDiscard} />
  </>;
}
