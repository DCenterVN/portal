"use client";
import { EmptyState, ErrorState } from "@/components/patterns/empty-state";
import { InlineAlert } from "@/components/patterns/inline-alert";
import { FieldError } from "@/components/ui/field";
import {useTranslations} from "next-intl";
import {FetchError} from "@/lib/fetcher";

import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useActivationApi } from "./use-activation-api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/patterns/password-input";
import { FormNotice, passwordError } from "./form-feedback";

function ResendForm({onSent}: {onSent: () => void}) {
 const t = useTranslations("customerAuth");
 const { resendActivation } = useActivationApi();
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

type ActivationFeedback = {key: string; field?: "password" | "confirm"};

function ActivationFields({id, busy, feedback}: {id: string; busy: boolean; feedback: ActivationFeedback}) {
  const t = useTranslations("customerAuth");
  return <>
    {(["password", "confirm"] as const).map(field => <div key={field} className="space-y-1.5">
      <Label htmlFor={`${id}-${field}`}>{t(field === "password" ? "newPassword" : "confirmPassword")}</Label>
      <PasswordInput id={`${id}-${field}`} name={field} autoComplete="new-password" disabled={busy}
        showLabel={t("showPassword")} hideLabel={t("hidePassword")}
        aria-invalid={feedback.field === field}
        aria-describedby={`${field === "password" ? `${id}-hint` : ""}${feedback.field === field ? ` ${id}-${field}-error` : ""}`.trim() || undefined} />
      {field === "password" && <p id={`${id}-hint`} className="text-xs text-muted-foreground">{t("passwordPolicy")}</p>}
      {feedback.field === field && <FieldError id={`${id}-${field}-error`}>{t(feedback.key)}</FieldError>}
    </div>)}
  </>;
}

export function ActivateView() {
  const { activateAccount } = useActivationApi();
  const t = useTranslations("customerAuth");
  const query = useSearchParams();
  const queryToken = query?.get("token") ?? "";
  const id = useId();
  const observedQuery = useRef(query);
  const link = useRef({token: queryToken, generation: 0, version: 0});
  // Query cleanup releases the URL reference without losing the captured challenge.
  if (query !== observedQuery.current && queryToken) {
    link.current = {token: queryToken, generation: link.current.generation + 1, version: link.current.version + 1};
  }
  observedQuery.current = query;
  const {token, generation} = link.current;
  const previousGeneration = useRef(generation);
  const pending = useRef(false);
  const formRef = useRef<HTMLFormElement>(null);
  const alertRef = useRef<HTMLDivElement>(null);
  const [state, setState] = useState("idle");
  const [feedback, setFeedback] = useState<ActivationFeedback>({key: ""});
  const [retryAt, setRetryAt] = useState(0);
  const [seconds, setSeconds] = useState(0);
  const busy = state === "pending";

  useEffect(() => {
    if (link.current.generation === generation && token) link.current.token = token;
    if (previousGeneration.current !== generation) {
      previousGeneration.current = generation;
      pending.current = false; setState("idle"); setFeedback({key: ""}); setRetryAt(0); setSeconds(0);
      formRef.current?.reset();
    }
    if (token && typeof window !== "undefined") {
      const url = new URL(window.location.href);
      window.history.replaceState(null, "", url.pathname + url.hash);
    }
    return () => {
      link.current.version += 1;
      if (link.current.generation === generation) link.current.token = "";
      formRef.current?.reset();
    };
  }, [generation]);
  useEffect(() => {
    if (!retryAt) return;
    const tick = () => setSeconds(Math.max(0, Math.ceil((retryAt - Date.now()) / 1000)));
    tick(); const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [retryAt]);
  useEffect(() => {if (feedback.key && !feedback.field) alertRef.current?.focus();}, [feedback]);

  const fieldError = (form: HTMLFormElement, field: "password" | "confirm", key: string) => {
    setFeedback({key, field}); form.querySelector<HTMLInputElement>(`[name="${field}"]`)?.focus();
  };
  const handleError = (err: unknown, form: HTMLFormElement) => {
    if (err instanceof FetchError && err.code === "VALIDATION_ERROR") {fieldError(form, "password", "activationPasswordInvalid"); return;}
    if (err instanceof FetchError && ["invalid_token", "BAD_REQUEST"].includes(err.code ?? "")) {
      setState("invalid"); setFeedback({key: "activationInvalid"}); link.current.token = ""; form.reset(); return;
    }
    const delay = err instanceof FetchError && [429, 503].includes(err.status) ? err.retryAfterMs ?? 0 : 0;
    setRetryAt(Date.now() + delay); setSeconds(Math.ceil(delay / 1000));
    setFeedback({key: err instanceof FetchError && err.status === 429 ? "rateLimited" : "activationFailed"});
  };
  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!token || pending.current || retryAt > Date.now() || state === "done" || state === "invalid") return;
    const form = event.currentTarget; const data = new FormData(form);
    const password = String(data.get("password") ?? "");
    const invalid = passwordError(password);
    if (invalid) {fieldError(form, "password", invalid); return;}
    if (password !== data.get("confirm")) {fieldError(form, "confirm", "passwordMismatch"); return;}
    const requestVersion = link.current.version;
    pending.current = true; setState("pending"); setFeedback({key: ""});
    try {
      await activateAccount(token, password);
      if (link.current.version !== requestVersion || link.current.token !== token) return;
      form.reset(); link.current.token = ""; setState("done");
    } catch (err) {
      if (link.current.version !== requestVersion || link.current.token !== token) return;
      setState("idle"); handleError(err, form);
    } finally {
      if (link.current.version === requestVersion) {pending.current = false; setState(current => current === "pending" ? "idle" : current);}
    }
  };

  const login = <Link href="/login" className="inline-flex min-h-11 items-center text-primary underline-offset-4 hover:underline">{t("login")}</Link>;
  if (state === "done") return <FormNotice title={t("activationDone")}><p>{t("activationReady")}</p>{login}</FormNotice>;
  if (state === "resent") return <FormNotice title={t("activationResent")}><p>{t("activationResentNotice")}</p>{login}</FormNotice>;
  if (!token || state === "invalid") return <div className="space-y-4">
    {state === "invalid" ? <ErrorState title={t("activationInvalid")} /> : <EmptyState title={t("activationMissing")} />}
    <ResendForm onSent={() => setState("resent")} />{login}
  </div>;
  return <form ref={formRef} key={generation} onSubmit={onSubmit} noValidate aria-busy={busy} className="space-y-4">
    {feedback.key && !feedback.field && <InlineAlert ref={alertRef} tabIndex={-1}>{t(feedback.key)}</InlineAlert>}
    <ActivationFields id={id} busy={busy} feedback={feedback} />
    {seconds > 0 && <p role="status" className="text-sm text-muted-foreground">{t("activationRetryWait", {seconds})}</p>}
    {busy && <p role="status">{t("activationPending")}</p>}
    <Button type="submit" disabled={busy || seconds > 0} className="w-full">{t(busy ? "activationPending" : "activationSubmit")}</Button>
    {login}
  </form>;
}
