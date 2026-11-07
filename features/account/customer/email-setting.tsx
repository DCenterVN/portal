"use client";

import { useState } from "react";
import { useForm, type UseFormReturn } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import type { z } from "zod";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { InlineAlert } from "@/components/patterns/inline-alert";
import { ConfirmDialog } from "@/components/patterns/confirm-dialog";
import { TextField } from "../text-field";
import { accountErrorMessage } from "@/lib/api/account-client";
import { emailSchema } from "@/lib/api/account-validation";
import { FetchError } from "@/lib/fetcher";
import { useAccountEmail } from "../use-account-forms";

type Values = z.infer<typeof emailSchema>;

function EmailForm({ sent, done, close, form }: { sent: (email: string) => void; done: () => void; close: () => void; form: UseFormReturn<Values> }) {
  const t = useTranslations("account");
  const account = useAccountEmail();
  const { isDirty, isSubmitting } = form.formState;
  function cancel() { close(); }
  async function submit(values: Values) {
    try { await account.save(values); sent(values.new_email); form.reset(); done(); }
    catch (error) {
      const code = error instanceof FetchError ? error.code : undefined;
      const field = code === "email_already_exists" ? "new_email" : code === "invalid_current_password" || code === "UNAUTHORIZED" ? "current_password" : "root";
      form.setError(field, { type: "server", message: accountErrorMessage(error, t) });
    }
  }
  return <form onSubmit={form.handleSubmit(submit)} className="space-y-4" noValidate>
    <TextField control={form.control} name="new_email" label={t("newEmail")} type="email" autoComplete="email" disabled={isSubmitting} />
    <TextField control={form.control} name="current_password" label={t("currentPassword")} type="password" autoComplete="current-password" disabled={isSubmitting} />
    {form.formState.errors.root && <InlineAlert>{form.formState.errors.root.message}</InlineAlert>}
    <DialogFooter>
      <Button variant="ghost" type="button" onClick={cancel} disabled={isSubmitting}>{t("cancel")}</Button>
      <Button type="submit" disabled={!isDirty || isSubmitting}>{t(isSubmitting ? "sending" : "sendConfirmation")}</Button>
    </DialogFooter>
  </form>;
}

export function EmailSetting({ email }: { email: string }) {
  const t = useTranslations("account");
  const [open, setOpen] = useState(false);
  const [sent, setSent] = useState("");
  const form = useForm<Values>({ resolver: zodResolver(emailSchema), mode: "onTouched", defaultValues: { new_email: "", current_password: "" } });
  const [discard, setDiscard] = useState(false);
  function show() { setOpen(true); }
  function hide() {
    if (form.formState.isSubmitting) return;
    setOpen(false);
    if (form.formState.isDirty) setDiscard(true);
  }
  function keepEditing(next: boolean) {
    setDiscard(next);
    if (!next) setOpen(true);
  }
  function discardChanges() { form.reset(); setDiscard(false); }
  return <>
    <div className="flex flex-wrap items-center gap-3">
      <span className="text-sm break-all">{email || t("none")}</span>
      <Button variant="ghost" size="sm" onClick={show}>{t("changeEmail")}</Button>
    </div>
    {sent && <InlineAlert tone="info">{t("emailSent", { email: sent })}</InlineAlert>}
    <Dialog open={open} onOpenChange={(next) => next ? setOpen(true) : hide()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle>{t("changeEmail")}</DialogTitle><DialogDescription>{t("emailHint")}</DialogDescription></DialogHeader>
        {open && <EmailForm sent={setSent} done={() => setOpen(false)} close={hide} form={form} />}
      </DialogContent>
    </Dialog>
    <ConfirmDialog open={discard} onOpenChange={keepEditing} title={t("discard")} description={t("discardHint")} confirmLabel={t("discardConfirm")} danger onConfirm={discardChanges} />
  </>;
}
