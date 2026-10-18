"use client";
import {EmptyState, ErrorState} from "@/components/ui/state";
import {useTranslations} from "next-intl";
import {FetchError} from "@/lib/fetcher";

import {useId, useRef, useState} from "react";
import {useSearchParams} from "next/navigation";
import Link from "next/link";
import {acceptInvite} from "@/lib/api/employee-auth";
import {Button} from "@/components/ui/button";
import { PasswordInput } from "@/components/patterns/password-input";
import {Label} from "@/components/ui/label";

export function InviteForm() {
 const t = useTranslations("employeeAuth");
 const id=useId();const token=useSearchParams().get("token")??"";const pending=useRef(false);
 const [busy,setBusy]=useState(false);const [error,setError]=useState("");const [accepted,setAccepted]=useState(false);
 const login=<Link href="/staff/login" className="inline-flex min-h-11 items-center text-[var(--color-primary)] underline"> {t("login")} </Link>;
 async function submit(event: React.FormEvent<HTMLFormElement>) {
  event.preventDefault();if(pending.current || !token) return;
  const element=event.currentTarget;const data=new FormData(element);const password=String(data.get("password")??"");const confirm=String(data.get("confirm")??"");
  const invalid=[...password].length<12 || new TextEncoder().encode(password).length>256;
  if(invalid || password!==confirm) {setError(invalid ? t("passwordPolicy") : t("passwordMismatch"));element.querySelector<HTMLInputElement>(`[name="${invalid ? "password" : "confirm"}"]`)?.focus();return;}
  pending.current=true;setBusy(true);setError("");
  try {await acceptInvite(token,password);setAccepted(true);}
  catch(err) {setError(t(err instanceof FetchError && err.code === "rate_limit_exceeded" ? "rateLimited" : "inviteFailed"));element.querySelector<HTMLInputElement>("input")?.focus();}
  finally {pending.current=false;setBusy(false);}
 }
 if(!token) return <div className="space-y-4"><EmptyState title={t("inviteExisting")} />{login}</div>;
 if(accepted) return <div className="space-y-4"><p role="status"> {t("inviteDone")} </p>{login}</div>;
 return <form onSubmit={submit} noValidate aria-busy={busy} className="space-y-4">
  {error && <div id={`${id}-error`}><ErrorState title={error} /></div>}
  <p className="text-sm text-[var(--color-muted)]"> {t("inviteInstruction")} </p>
  <div className="space-y-2"><Label htmlFor={`${id}-password`}> {t("newPassword")} </Label><PasswordInput id={`${id}-password`} name="password" autoComplete="new-password" required disabled={busy} aria-invalid={!!error} aria-describedby={error ? `${id}-error` : undefined}/></div>
  <div className="space-y-2"><Label htmlFor={`${id}-confirm`}> {t("confirmPassword")} </Label><PasswordInput id={`${id}-confirm`} name="confirm" autoComplete="new-password" required disabled={busy} aria-invalid={!!error} aria-describedby={error ? `${id}-error` : undefined}/></div>
  <Button type="submit" disabled={busy} className="w-full">{busy ? t("invitePending") : t("invite")}</Button>{login}
 </form>;
}
