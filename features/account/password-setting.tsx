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
import { accountErrorMessage } from "@/lib/api/account-client";
import { passwordSchema } from "@/lib/api/account-validation";
import { FetchError } from "@/lib/fetcher";
import { TextField } from "./text-field";
import { useAccountPassword } from "./use-account-forms";

type Values = z.infer<typeof passwordSchema>;

function PasswordForm({ loginPath, close, form }: { loginPath: string; close: () => void; form: UseFormReturn<Values> }) {
  const t = useTranslations("account");
  const account = useAccountPassword(loginPath);
  const { isDirty, isSubmitting } = form.formState;
  function cancel() { close(); }
  async function submit(values: Values) {
    try { await account.save(values); form.reset(); }
    catch (error) {
      const wrong = error instanceof FetchError && ["invalid_current_password", "UNAUTHORIZED"].includes(error.code ?? "");
      form.setError(wrong ? "current_password" : "root", { type: "server", message: accountErrorMessage(error, t) });
    }
  }
  return <form onSubmit={form.handleSubmit(submit)} className="space-y-4" noValidate>
    <TextField control={form.control} name="current_password" label={t("currentPassword")} type="password" autoComplete="current-password" disabled={isSubmitting} />
    <TextField control={form.control} name="new_password" label={t("newPassword")} hint={t("passwordHint")} type="password" autoComplete="new-password" disabled={isSubmitting} />
    <TextField control={form.control} name="repeat" label={t("repeatPassword")} type="password" autoComplete="new-password" disabled={isSubmitting} />
    {form.formState.errors.root && <InlineAlert>{form.formState.errors.root.message}</InlineAlert>}
    <DialogFooter>
      <Button variant="ghost" type="button" onClick={cancel} disabled={isSubmitting}>{t("cancel")}</Button>
      <Button type="submit" disabled={!isDirty || isSubmitting}>{t(isSubmitting ? "saving" : "changePassword")}</Button>
    </DialogFooter>
  </form>;
}

export function PasswordSetting({ loginPath }: { loginPath: string }) {
  const t = useTranslations("account");
  const [open, setOpen] = useState(false);
  const form = useForm<Values>({ resolver: zodResolver(passwordSchema), mode: "onTouched", defaultValues: { current_password: "", new_password: "", repeat: "" } });
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
    <Button variant="outline" onClick={show}>{t("changePassword")}</Button>
    <Dialog open={open} onOpenChange={(next) => next ? setOpen(true) : hide()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle>{t("changePassword")}</DialogTitle><DialogDescription>{t("passwordDialogHint")}</DialogDescription></DialogHeader>
        {open && <PasswordForm loginPath={loginPath} close={hide} form={form} />}
      </DialogContent>
    </Dialog>
    <ConfirmDialog open={discard} onOpenChange={keepEditing} title={t("discard")} description={t("discardHint")} confirmLabel={t("discardConfirm")} danger onConfirm={discardChanges} />
  </>;
}
