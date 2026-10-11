"use client";
import {EmptyState, ErrorState} from "@/components/ui/state";
import {useTranslations} from "next-intl";
import {FetchError} from "@/lib/fetcher";
import {useId, useRef, useState} from "react";
import Link from "next/link";
import type {Route} from "next";
import {useRouter} from "next/navigation";
import {Eye, EyeOff, Loader2} from "lucide-react";
import {login} from "@/lib/api/employee-auth";
import {Button} from "@/components/ui/button";
import {Field, TextInput} from "@/components/ui/field";

export function StaffLogin() {
 const t = useTranslations("employeeAuth");
 const id = useId(); const pending = useRef(false); const router = useRouter();
 const [busy, setBusy] = useState(false); const [error, setError] = useState("");
 const [forbiddenLogin, setForbiddenLogin] = useState(false);
 const [shown, setShown] = useState(false);
 async function submit(event: React.FormEvent<HTMLFormElement>) {
  event.preventDefault(); if (pending.current) return;
  const form = event.currentTarget; const data = new FormData(form);
  const identifier = String(data.get("identifier") ?? "").trim(); const password = String(data.get("password") ?? "");
  if (!identifier || !password) {setForbiddenLogin(false); setError(t("invalidCredentials")); form.querySelector<HTMLInputElement>(`[name="${!identifier ? "identifier" : "password"}"]`)?.focus(); return;}
  pending.current = true; setBusy(true); setError(""); setForbiddenLogin(false);
  try {const result = await login(identifier, password); router.push(result.next_path as Route); router.refresh();}
  catch (err) {setForbiddenLogin(err instanceof FetchError && err.status === 403 && err.code === "FORBIDDEN"); setError(t(err instanceof FetchError && err.code === "rate_limit_exceeded" ? "rateLimited" : "loginFailed")); form.querySelector<HTMLInputElement>("input")?.focus();}
  finally {pending.current = false; setBusy(false);}
 }
 const invalid = error ? true : undefined; const describedBy = error ? `${id}-error` : undefined;
 return <form noValidate onSubmit={submit} aria-busy={busy} className="grid gap-4">
  {!busy && !error && <EmptyState title={t("loginTitle")} description={t("invalidCredentials")} className="py-6" />}
  {error && <div id={`${id}-error`}><ErrorState title={error} action={forbiddenLogin && <Link href="/login" className="font-semibold text-[var(--color-primary)] underline">{t("customerLogin")}</Link>} /></div>}
  <Field label={t("identifier")} htmlFor={`${id}-identifier`}>
   <TextInput id={`${id}-identifier`} name="identifier" autoComplete="username" disabled={busy} required aria-invalid={invalid} aria-describedby={describedBy} />
  </Field>
  <Field label={t("password")} htmlFor={`${id}-password`}>
   <div className="relative">
    <TextInput id={`${id}-password`} name="password" type={shown ? "text" : "password"} autoComplete="current-password" disabled={busy} required aria-invalid={invalid} aria-describedby={describedBy} className="pr-12" />
    <Button type="button" variant="ghost" size="icon" aria-label={shown ? "Ẩn mật khẩu" : "Hiện mật khẩu"} aria-pressed={shown} onClick={() => setShown(!shown)} className="absolute top-0 right-0">
     {shown ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}
    </Button>
   </div>
  </Field>
  <Button type="submit" disabled={busy} className="w-full">{busy && <Loader2 aria-hidden="true" className="animate-spin" />}{busy ? t("loginPending") : t("login")}</Button>
  <Link href="/staff/forgot-password" className="flex min-h-11 items-center justify-center text-sm font-semibold text-[var(--color-primary)] hover:underline"> {t("forgot")} </Link>
 </form>;
}
