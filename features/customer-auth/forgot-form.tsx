"use client";
import {EmptyState, ErrorState} from "@/components/ui/state";
import {useTranslations} from "next-intl";


import { useId, useRef, useState } from "react";
import Link from "next/link";
import type { Route } from "next";
import { forgotPassword } from "@/lib/api/customer-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FormNotice } from "./form-feedback";

export function ForgotForm() {
 const t = useTranslations("customerAuth");
  const id = useId(); const pending = useRef(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (pending.current) return;
    const formElement = e.currentTarget;
    const email = String(new FormData(e.currentTarget).get("email") ?? "").trim();
    if (!email) {setError(t("emailRequired")); formElement.querySelector<HTMLInputElement>("input")?.focus(); return;}
    pending.current = true;
    setBusy(true);
    setError("");
    try {
      await forgotPassword(email);
      setSent(true);
    } catch {
      setError(t("networkFailed"));
    } finally {
      pending.current = false;
      setBusy(false);
    }
  };

  // ponytail: fixed copy, never the server's message — the answer must not reveal whether the email exists
  if (sent) {
    return (
      <FormNotice title={t("checkInbox")}>
        <p> {t("recoveryNotice")} </p>
        <p><Link href={"/login" as Route} className="inline-flex min-h-11 items-center font-semibold text-[var(--color-primary)] hover:underline"> {t("loginReturn")} </Link></p>
      </FormNotice>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate aria-busy={busy} className="space-y-4">
      {!busy && !error && <EmptyState title={t("forgotTitle")} description={t("emailRequired")} />}
      {error && <div id={`${id}-error`}><ErrorState title={error} /></div>}
      <div className="space-y-1.5">
        <Label htmlFor={`${id}-email`}> {t("email")} </Label>
        <Input id={`${id}-email`} name="email" type="email" autoComplete="email" disabled={busy} aria-invalid={!!error} aria-describedby={error ? `${id}-error` : undefined} className="min-h-11" />
      </div>
      <Button type="submit" disabled={busy} className="w-full">{busy ? t("sendPending") : t("sendReset")}</Button>
      <p className="border-t border-[var(--color-line)] pt-4 text-center text-sm text-[var(--color-muted)]"> {t("rememberPassword")} <Link href={"/login" as Route} className="inline-flex min-h-11 items-center font-semibold text-[var(--color-primary)] hover:underline"> {t("login")} </Link>
      </p>
    </form>
  );
}
