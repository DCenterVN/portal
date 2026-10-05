"use client";
import {EmptyState, ErrorState} from "@/components/ui/state";
import {useTranslations} from "next-intl";
import {FetchError} from "@/lib/fetcher";


import { useId, useRef, useState } from "react";
import Link from "next/link";
import type { Route } from "next";
import { register } from "@/lib/api/customer-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FormNotice, passwordError } from "./form-feedback";

function validate(email: string, phone: string, name: string, password: string): string {
  if (!email && !phone) return "identityRequired";
  if ([...name].length > 50) return "nameTooLong";
  return passwordError(password);
}

export function RegisterForm() {
 const t = useTranslations("customerAuth");
  const id = useId(); const pending = useRef(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [errorField, setErrorField] = useState("");
  const [sentTo, setSentTo] = useState("");

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (pending.current) return;
    const formElement = e.currentTarget;
    const form = new FormData(e.currentTarget);
    const [email, phone, name] = ["email", "phone", "display_name"].map((k) => String(form.get(k) ?? "").trim());
    const password = String(form.get("password") ?? "");
    const invalid = validate(email, phone, name, password);
    if (invalid) {
      const field = !email && !phone ? "email" : [...name].length > 50 ? "display_name" : "password";
      setErrorField(field); setError(t(invalid));
      formElement.querySelector<HTMLInputElement>(`[name="${field}"]`)?.focus(); return;
    }
    pending.current = true;
    setBusy(true);
    setError(""); setErrorField("");
    try {
      await register(email, phone, name, password);
      setSentTo(email || phone);
    } catch (err) {
      setError(t(err instanceof FetchError && err.code === "rate_limit_exceeded" ? "rateLimited" : "registerFailed"));
    } finally {
      pending.current = false;
      setBusy(false);
    }
  };

  if (sentTo) {
    return (
      <FormNotice title={t("checkInbox")}>
        <p>{t("activationSent", {destination: sentTo})}</p>
        <p><Link href={"/login" as Route} className="inline-flex min-h-11 items-center font-semibold text-[var(--color-primary)] hover:underline"> {t("loginReturn")} </Link></p>
      </FormNotice>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate aria-busy={busy} className="space-y-4">
      {!busy && !error && <EmptyState title={t("createAccount")} description={t("identityRequired")} />}
      {error && <div id={`${id}-error`}><ErrorState title={error} /></div>}
      <div className="space-y-1.5">
        <Label htmlFor={`${id}-display_name`}> {t("displayName")} </Label>
        <Input id={`${id}-display_name`} name="display_name" autoComplete="name" maxLength={50} disabled={busy} aria-invalid={!!error && (!errorField || errorField === "display_name")} aria-describedby={error ? `${id}-error` : undefined} className="min-h-11" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor={`${id}-email`}> {t("email")} </Label>
          <Input id={`${id}-email`} name="email" type="email" autoComplete="email" disabled={busy} aria-invalid={!!error && (!errorField || errorField === "email")} aria-describedby={error ? `${id}-error` : undefined} className="min-h-11" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={`${id}-phone`}> {t("phone")} </Label>
          <Input id={`${id}-phone`} name="phone" type="tel" autoComplete="tel" disabled={busy} aria-invalid={!!error && (!errorField || errorField === "phone")} aria-describedby={error ? `${id}-error` : undefined} className="min-h-11" />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor={`${id}-password`}> {t("password")} </Label>
        <Input type="password" id={`${id}-password`} name="password" autoComplete="new-password" aria-describedby={`${id}-password-hint${error ? ` ${id}-error` : ""}`} disabled={busy} aria-invalid={!!error && (!errorField || errorField === "password")} />
        <p id={`${id}-password-hint`} className="text-xs text-[var(--color-muted)]"> {t("passwordHint")} </p>
      </div>
      <Button type="submit" variant="accent" disabled={busy} className="w-full">{busy ? t("registerPending") : t("createAccount")}</Button>
      <div className="space-y-1 border-t border-[var(--color-line)] pt-4 text-center text-sm text-[var(--color-muted)]">
        <p> {t("hasAccount")} <Link href={"/login" as Route} className="inline-flex min-h-11 items-center font-semibold text-[var(--color-primary)] hover:underline"> {t("login")} </Link></p>
      </div>
    </form>
  );
}
