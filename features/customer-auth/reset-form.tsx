"use client";
import {EmptyState, ErrorState} from "@/components/ui/state";
import {useTranslations} from "next-intl";
import {FetchError} from "@/lib/fetcher";


import { useId, useRef, useState } from "react";
import Link from "next/link";
import type { Route } from "next";
import { useSearchParams } from "next/navigation";
import { resetPassword } from "@/lib/api/customer-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FormNotice, passwordError } from "./form-feedback";

export function ResetForm() {
 const t = useTranslations("customerAuth");
  const id = useId(); const pending = useRef(false);
  const token = useSearchParams()?.get("token") ?? "";
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(token ? "" : t("resetMissing"));
  const [done, setDone] = useState(false);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (pending.current) return;
    const formElement = e.currentTarget;
    const form = new FormData(e.currentTarget);
    const password = String(form.get("password") ?? "");
    if (!token) return;
    const invalid = passwordError(password);
    if (invalid) {setError(t(invalid)); formElement.querySelector<HTMLInputElement>('[name="password"]')?.focus(); return;}
    if (password !== form.get("confirm")) {setError(t("passwordMismatch")); formElement.querySelector<HTMLInputElement>('[name="confirm"]')?.focus(); return;}
    pending.current = true;
    setBusy(true);
    setError("");
    try {
      await resetPassword(token, password);
      setDone(true);
    } catch (err) {
      setError(t(err instanceof FetchError && err.code === "rate_limit_exceeded" ? "rateLimited" : "resetInvalid"));
    } finally {
      pending.current = false;
      setBusy(false);
    }
  };

  if (done) {
    return (
      <FormNotice title={t("resetDone")}>
        <p> {t("resetNotice")} </p>
        <p><Link href={"/login" as Route} className="inline-flex min-h-11 items-center font-semibold text-[var(--color-primary)] hover:underline"> {t("login")} </Link></p>
      </FormNotice>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate aria-busy={busy} className="space-y-4">
      {!token && <EmptyState title={t("resetMissing")} action={<Link href="/forgot-password">{t("requestNewLink")}</Link>} />}
      {error && <div id={`${id}-error`}><ErrorState title={error} /></div>}
      <div className="space-y-1.5">
        <Label htmlFor={`${id}-password`}> {t("newPassword")} </Label>
        <Input type="password" id={`${id}-password`} name="password" autoComplete="new-password" aria-describedby={`${id}-password-hint${error ? ` ${id}-error` : ""}`} disabled={busy || !token} aria-invalid={!!error} />
        <p id={`${id}-password-hint`} className="text-xs text-[var(--color-muted)]"> {t("passwordHint")} </p>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor={`${id}-confirm`}> {t("confirmPassword")} </Label>
        <Input type="password" id={`${id}-confirm`} name="confirm" autoComplete="new-password" disabled={busy || !token} aria-invalid={!!error} aria-describedby={error ? `${id}-error` : undefined} />
      </div>
      <Button type="submit" disabled={busy || !token} className="w-full">{busy ? t("savePending") : t("reset")}</Button>
      <p className="border-t border-[var(--color-line)] pt-4 text-center text-sm text-[var(--color-muted)]">
        <Link href={"/forgot-password" as Route} className="inline-flex min-h-11 items-center font-semibold text-[var(--color-primary)] hover:underline"> {t("requestNewLink")} </Link>
      </p>
    </form>
  );
}
