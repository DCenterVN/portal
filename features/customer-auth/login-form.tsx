"use client";
import {EmptyState, ErrorState} from "@/components/ui/state";
import {useTranslations} from "next-intl";
import {FetchError} from "@/lib/fetcher";

import { useId, useRef, useState } from "react";
import Link from "next/link";
import type { Route } from "next";
import { useRouter } from "next/navigation";
import { login } from "@/lib/api/customer-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";


export function LoginForm() {
 const t = useTranslations("customerAuth");
  const id = useId(); const pending = useRef(false); const router = useRouter();
  const [busy, setBusy] = useState(false); const [error, setError] = useState("");
  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault(); if (pending.current) return;
    const form = event.currentTarget; const data = new FormData(form);
    const identifier = String(data.get("identifier") ?? "").trim(); const password = String(data.get("password") ?? "");
    if (!identifier || !password) {setError(t("invalidCredentials")); form.querySelector<HTMLInputElement>(`[name="${!identifier ? "identifier" : "password"}"]`)?.focus(); return;}
    pending.current = true; setBusy(true); setError("");
    try {const result = await login(identifier, password); router.push(result.next_path as Route); router.refresh();}
    catch (err) {setError(t(err instanceof FetchError && err.code === "rate_limit_exceeded" ? "rateLimited" : "loginFailed")); form.querySelector<HTMLInputElement>("input")?.focus();}
    finally {pending.current = false; setBusy(false);}
  };
  return <form onSubmit={onSubmit} noValidate aria-busy={busy} className="space-y-4">
    {!busy && !error && <EmptyState title={t("loginTitle")} description={t("invalidCredentials")} />}
    {error && <div id={`${id}-error`}><ErrorState title={error} /></div>}
    <div className="space-y-1.5"><Label htmlFor={`${id}-identifier`}> {t("identifier")} </Label><Input id={`${id}-identifier`} name="identifier" autoComplete="username" required disabled={busy} aria-invalid={!!error} aria-describedby={error ? `${id}-error` : undefined} /></div>
    <div className="space-y-1.5"><Label htmlFor={`${id}-password`}> {t("password")} </Label><Input id={`${id}-password`} name="password" type="password" autoComplete="current-password" required disabled={busy} aria-invalid={!!error} aria-describedby={error ? `${id}-error` : undefined} /><Link href="/forgot-password" className="flex min-h-11 items-center justify-end text-sm text-[var(--color-primary)] hover:underline"> {t("forgot")} </Link></div>
    <Button type="submit" disabled={busy} className="w-full">{busy ? t("loginPending") : t("login")}</Button>
    <p className="text-center text-sm"> {t("noAccount")} <Link href="/register" className="inline-flex min-h-11 items-center font-semibold text-[var(--color-primary)] hover:underline"> {t("register")} </Link></p>
  </form>;
}
