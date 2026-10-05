"use client";
import {EmptyState, ErrorState} from "@/components/ui/state";
import {useTranslations} from "next-intl";
import {FetchError} from "@/lib/fetcher";

import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { activateAccount, resendActivation } from "@/lib/api/customer-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FormNotice } from "./form-feedback";

function ResendForm({onSent}: {onSent: () => void}) {
 const t = useTranslations("customerAuth");
  const id = useId(); const pending = useRef(false); const [busy, setBusy] = useState(false); const [error, setError] = useState("");
  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault(); if (pending.current) return;
    const form = event.currentTarget; const email = String(new FormData(form).get("email") ?? "").trim();
    if (!email) {setError(t("registeredEmailRequired")); form.querySelector<HTMLInputElement>("input")?.focus(); return;}
    pending.current = true; setBusy(true); setError("");
    try {await resendActivation(email); onSent();}
    catch (err) {setError(t(err instanceof FetchError && err.code === "rate_limit_exceeded" ? "rateLimited" : "resendFailed"));}
    finally {pending.current = false; setBusy(false);}
  };
  return <form onSubmit={onSubmit} noValidate aria-busy={busy} className="space-y-3">
    {error && <div id={`${id}-error`}><ErrorState title={error} /></div>}
    <Label htmlFor={`${id}-email`}> {t("registeredEmail")} </Label>
    <Input id={`${id}-email`} name="email" type="email" autoComplete="email" disabled={busy} aria-invalid={!!error} aria-describedby={error ? `${id}-error` : undefined} />
    <Button type="submit" disabled={busy} className="w-full">{busy ? t("sendPending") : t("resendActivation")}</Button>
  </form>;
}
export function ActivateView() {
 const t = useTranslations("customerAuth");
  const token = useSearchParams()?.get("token") ?? ""; const attempted = useRef("");
  const [state, setState] = useState(token ? "checking" : "failed");
  const [error, setError] = useState(token ? "" : t("activationMissing"));
  useEffect(() => {
    if (!token || attempted.current === token) return;
    attempted.current = token; setState("checking");
    activateAccount(token).then(() => {if (attempted.current === token) setState("done");}).catch((err) => {if (attempted.current !== token) return; setError(t(err instanceof FetchError && err.code === "rate_limit_exceeded" ? "rateLimited" : "activationInvalid")); setState("failed");});
  }, [token]);
  if (state === "checking") return <p role="status" aria-busy="true"> {t("activationPending")} </p>;
  if (state === "done") return <FormNotice title={t("activationDone")}><p> {t("activationReady")} </p><Link href="/login" className="inline-flex min-h-11 items-center text-[var(--color-primary)] hover:underline"> {t("login")} </Link></FormNotice>;
  if (state === "resent") return <FormNotice title={t("activationResent")}><p> {t("activationResentNotice")} </p></FormNotice>;
  return <div className="space-y-4">{!token && <EmptyState title={t("activationMissing")} />}<ErrorState title={error} /><ResendForm onSent={() => setState("resent")} /></div>;
}
