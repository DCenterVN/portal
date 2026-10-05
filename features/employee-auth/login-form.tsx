"use client";
import {EmptyState, ErrorState} from "@/components/ui/state";
import {useTranslations} from "next-intl";
import {FetchError} from "@/lib/fetcher";

import {useId, useRef, useState} from "react";
import Link from "next/link";
import type {Route} from "next";
import {useRouter} from "next/navigation";
import {login} from "@/lib/api/employee-auth";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {Label} from "@/components/ui/label";

export function LoginForm() {
 const t = useTranslations("employeeAuth");
 const id=useId(); const pending=useRef(false);const router=useRouter();
 const [busy,setBusy]=useState(false);const [error,setError]=useState("");
 const [forbiddenLogin,setForbiddenLogin]=useState(false);
 async function submit(event: React.FormEvent<HTMLFormElement>) {
  event.preventDefault();if(pending.current) return;
  const form=event.currentTarget;const data=new FormData(form);
  const identifier=String(data.get("identifier")??"").trim();const password=String(data.get("password")??"");
  if(!identifier || !password) {setForbiddenLogin(false);setError(t("invalidCredentials"));form.querySelector<HTMLInputElement>(`[name="${!identifier ? "identifier" : "password"}"]`)?.focus();return;}
  pending.current=true;setBusy(true);setError("");setForbiddenLogin(false);
  try {const result=await login(identifier,password);router.push(result.next_path as Route);router.refresh();}
  catch(err) {setForbiddenLogin(err instanceof FetchError && err.status === 403 && err.code === "FORBIDDEN");setError(t(err instanceof FetchError && err.code === "rate_limit_exceeded" ? "rateLimited" : "loginFailed"));form.querySelector<HTMLInputElement>("input")?.focus();}
  finally {pending.current=false;setBusy(false);}
 }
 return <form noValidate onSubmit={submit} aria-busy={busy} className="space-y-4">
  {!busy && !error && <EmptyState title={t("loginTitle")} description={t("invalidCredentials")} />}
    {error && <div id={`${id}-error`}><ErrorState title={error} action={forbiddenLogin && <Link href="/login" className="underline">{t("customerLogin")}</Link>} /></div>}
  <div className="space-y-2"><Label htmlFor={`${id}-identifier`}> {t("identifier")} </Label><Input id={`${id}-identifier`} name="identifier" autoComplete="username" disabled={busy} required aria-invalid={!!error} aria-describedby={error ? `${id}-error` : undefined}/></div>
  <div className="space-y-2"><Label htmlFor={`${id}-password`}> {t("password")} </Label><Input id={`${id}-password`} name="password" type="password" autoComplete="current-password" disabled={busy} required aria-invalid={!!error} aria-describedby={error ? `${id}-error` : undefined}/></div>
  <Button type="submit" disabled={busy} className="w-full">{busy ? t("loginPending") : t("login")}</Button>
  <Link href="/staff/forgot-password" className="flex min-h-11 items-center justify-center text-sm text-[var(--color-primary)] hover:underline"> {t("forgot")} </Link>
 </form>;
}
