"use client";

import { useId, useRef, useState } from "react";
import Link from "next/link";
import type { Route } from "next";
import { useTranslations } from "next-intl";
import { FetchError } from "@/lib/fetcher";
import { register, resendActivation } from "@/lib/api/customer-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { EmptyState, ErrorState } from "@/components/ui/state";
import { FormNotice, passwordError } from "./form-feedback";
import { cn } from "@/lib/utils";

function validate(email: string, phone: string, name: string, password: string): string {
  if (!email && !phone) return "identityRequired";
  if ([...name].length > 50) return "nameTooLong";
  return passwordError(password);
}

const SHAKE_STYLE = `
@keyframes shake {
  0%, 100% { transform: translateX(0); }
  20%, 60% { transform: translateX(-4px); }
  40%, 80% { transform: translateX(4px); }
}
.animate-shake {
  animation: shake 300ms cubic-bezier(.2,0,.38,.9);
}
@media (prefers-reduced-motion: reduce) {
  .animate-shake { animation: none !important; }
}
`;

export function RegisterForm() {
  const t = useTranslations("customerAuth");
  const id = useId();
  const pending = useRef(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [errorField, setErrorField] = useState("");
  const [sentTo, setSentTo] = useState("");
  const [sentEmail, setSentEmail] = useState("");
  const [resend, setResend] = useState<"" | "busy" | "done" | "failed">("");

  const onResend = async () => {
    setResend("busy");
    try {
      await resendActivation(sentEmail);
      setResend("done");
    } catch {
      setResend("failed");
    }
  };

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
      setErrorField(field);
      setError(t(invalid));
      formElement.querySelector<HTMLInputElement>(`[name="${field}"]`)?.focus();
      return;
    }
    pending.current = true;
    setBusy(true);
    setError("");
    setErrorField("");
    try {
      await register(email, phone, name, password);
      setSentTo(email || phone);
      setSentEmail(email);
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
        <p className="text-fg-2">{t("activationSent", { destination: sentTo })}</p>
        {sentEmail && (
          <p>
            <Button type="button" variant="outline" size="sm" disabled={resend === "busy"} onClick={onResend}>
              {resend === "busy" ? t("sendPending") : t("resendActivation")}
            </Button>
          </p>
        )}
        {resend === "done" && <p className="text-sm font-semibold text-ok">{t("resendDone")}</p>}
        {resend === "failed" && <p role="alert" className="text-sm font-semibold text-err">{t("resendFailed")}</p>}
        <p className="pt-2">
          <Link href={"/login" as Route} className="inline-flex min-h-11 items-center font-bold text-p-text hover:text-p-hover hover:underline">
            {t("loginReturn")}
          </Link>
        </p>
      </FormNotice>
    );
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: SHAKE_STYLE }} />
      <form onSubmit={onSubmit} noValidate aria-busy={busy} className="space-y-4">
        {!busy && !error && <EmptyState title={t("createAccount")} description={t("identityRequired")} className="py-4" />}
        {error && (
          <div id={`${id}-error`} className="animate-shake">
            <ErrorState title={error} className="py-4 rounded-lg border-solid border-err/40 bg-err-soft/50 text-err" />
          </div>
        )}
        <div className="space-y-1.5">
          <Label htmlFor={`${id}-display_name`} className="font-semibold text-sm text-fg">
            {t("displayName")}
          </Label>
          <Input
            id={`${id}-display_name`}
            name="display_name"
            placeholder={t("phDisplayName")}
            autoComplete="name"
            maxLength={50}
            disabled={busy}
            aria-invalid={!!error && (!errorField || errorField === "display_name")}
            aria-describedby={error ? `${id}-error` : undefined}
            className={cn("min-h-11 rounded-sm border-line-strong transition-colors duration-150", !!error && errorField === "display_name" && "border-err focus-visible:ring-err")}
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor={`${id}-email`} className="font-semibold text-sm text-fg">
              {t("email")}
            </Label>
            <Input
              id={`${id}-email`}
              name="email"
              placeholder={t("phEmail")}
              type="email"
              autoComplete="email"
              disabled={busy}
              aria-invalid={!!error && (!errorField || errorField === "email")}
              aria-describedby={error ? `${id}-error` : undefined}
              className={cn("min-h-11 rounded-sm border-line-strong transition-colors duration-150", !!error && errorField === "email" && "border-err focus-visible:ring-err")}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor={`${id}-phone`} className="font-semibold text-sm text-fg">
              {t("phone")}
            </Label>
            <Input
              id={`${id}-phone`}
              name="phone"
              placeholder={t("phPhone")}
              type="tel"
              autoComplete="tel"
              disabled={busy}
              aria-invalid={!!error && (!errorField || errorField === "phone")}
              aria-describedby={error ? `${id}-error` : undefined}
              className={cn("min-h-11 rounded-sm border-line-strong transition-colors duration-150", !!error && errorField === "phone" && "border-err focus-visible:ring-err")}
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={`${id}-password`} className="font-semibold text-sm text-fg">
            {t("password")}
          </Label>
          <Input
            type="password"
            id={`${id}-password`}
            name="password"
            placeholder={t("phPassword")}
            autoComplete="new-password"
            aria-describedby={`${id}-password-hint${error ? ` ${id}-error` : ""}`}
            disabled={busy}
            aria-invalid={!!error && (!errorField || errorField === "password")}
            className={cn("h-11 rounded-sm border-line-strong transition-colors duration-150", !!error && errorField === "password" && "border-err focus-visible:ring-err")}
          />
          <p id={`${id}-password-hint`} className="text-xs text-fg-3">
            {t("passwordHint")}
          </p>
        </div>
        <Button
          type="submit"
          variant="accent"
          size="touch"
          disabled={busy}
          className="w-full text-sm font-bold shadow-sm transition-colors duration-100"
        >
          {busy ? t("registerPending") : t("createAccount")}
        </Button>
        <div className="space-y-1 border-t border-line pt-4 text-center text-sm text-fg-2">
          <p>
            {t("hasAccount")}{" "}
            <Link
              href={"/login" as Route}
              className="inline-flex min-h-11 items-center font-bold text-p-text hover:text-p-hover hover:underline"
            >
              {t("login")}
            </Link>
          </p>
        </div>
      </form>
    </>
  );
}
