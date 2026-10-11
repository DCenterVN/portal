"use client";

import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import type { Route } from "next";
import { AlertCircle } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { FetchError } from "@/lib/fetcher";
import { login } from "@/lib/api/customer-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/patterns/password-input";
import { cn } from "@/lib/utils";

function loginErrorKey(err: unknown): string {
  if (!(err instanceof FetchError)) return "loginFailed";
  if (err.status === 429 || err.code === "rate_limit_exceeded") return "rateLimited";
  if (err.status === 403 && (err.info as { reason?: string } | undefined)?.reason === "NOT_ACTIVATED") return "notActivated";
  if (err.status === 401) return "invalidLogin";
  return err.status >= 500 ? "serviceBusy" : "loginFailed";
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

export function LoginForm() {
  const t = useTranslations("customerAuth");
  const id = useId();
  const pending = useRef(false);
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [errorKey, setErrorKey] = useState("");
  const [wait, setWait] = useState(0);
  const redirect = useSearchParams()?.get("redirect") ?? undefined;

  useEffect(() => {
    if (wait <= 0) return;
    const timer = setTimeout(() => setWait(wait - 1), 1000);
    return () => clearTimeout(timer);
  }, [wait]);

  const error = errorKey === "rateLimited" && wait > 0 ? t("rateLimitedWait", { seconds: wait }) : errorKey ? t(errorKey) : "";

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (pending.current) return;
    const form = event.currentTarget;
    const data = new FormData(form);
    const identifier = String(data.get("identifier") ?? "").trim();
    const password = String(data.get("password") ?? "");
    if (!identifier || !password) {
      setErrorKey("invalidCredentials");
      form.querySelector<HTMLInputElement>(`[name="${!identifier ? "identifier" : "password"}"]`)?.focus();
      return;
    }
    pending.current = true;
    setBusy(true);
    setErrorKey("");
    try {
      const result = await login(identifier, password, redirect);
      router.push(result.next_path as Route);
      router.refresh();
    } catch (err) {
      const key = loginErrorKey(err);
      setErrorKey(key);
      const ms = err instanceof FetchError ? (err.info as { retry_after_ms?: unknown } | undefined)?.retry_after_ms : undefined;
      if (key === "rateLimited" && typeof ms === "number" && ms > 0) setWait(Math.ceil(ms / 1000));
      form.querySelector<HTMLInputElement>("input")?.focus();
    } finally {
      pending.current = false;
      setBusy(false);
    }
  };

  const invalidBorder = error && "border-err focus-visible:ring-err";

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: SHAKE_STYLE }} />
      <div role="tablist" aria-label={t("login")} className="mb-5 grid grid-cols-2 rounded-sm border border-line bg-l1-2 p-0.5 text-sm font-bold">
        <span role="tab" aria-selected="true" className="flex min-h-10 items-center justify-center rounded-[2px] border border-line bg-l1 text-fg">
          {t("login")}
        </span>
        <Link href="/register" role="tab" aria-selected="false" className="flex min-h-10 items-center justify-center rounded-[2px] border border-transparent text-fg-2 hover:text-fg">
          {t("tabRegister")}
        </Link>
      </div>
      <form onSubmit={onSubmit} noValidate aria-busy={busy} className="space-y-4">
        {error && (
          <div id={`${id}-error`} role="alert" className="animate-shake flex flex-wrap items-center gap-x-2.5 gap-y-1 rounded-lg border border-err bg-err-soft px-3.5 py-2.5 text-sm font-semibold text-err">
            <AlertCircle aria-hidden="true" className="size-5 shrink-0" />
            <span>{error}</span>
            {errorKey === "notActivated" && (
              <Link href="/activate" className="underline">
                {t("resendActivation")}
              </Link>
            )}
          </div>
        )}
        <div className="space-y-1">
          <Label htmlFor={`${id}-identifier`} className="text-sm font-bold text-fg">
            {t("identifier")}
          </Label>
          <Input
            id={`${id}-identifier`}
            name="identifier"
            placeholder={t("phIdentifier")}
            autoComplete="username"
            required
            disabled={busy}
            aria-invalid={!!error}
            aria-describedby={error ? `${id}-error` : undefined}
            className={cn("h-10 rounded-sm border-line-strong shadow-none", invalidBorder)}
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor={`${id}-password`} className="text-sm font-bold text-fg">
            {t("password")}
          </Label>
          <PasswordInput
            id={`${id}-password`}
            name="password"
            placeholder={t("phPassword")}
            autoComplete="current-password"
            required
            disabled={busy}
            aria-invalid={!!error}
            aria-describedby={error ? `${id}-error` : undefined}
            className={cn("h-10 rounded-sm border-line-strong shadow-none", invalidBorder)}
          />
          <p className="text-xs text-fg-3">{t("passwordRange")}</p>
          <Link href="/forgot-password" className="inline-flex min-h-8 items-center text-sm font-bold text-p-text hover:text-p-hover hover:underline">
            {t("forgot")}
          </Link>
        </div>
        <Button type="submit" variant="primary" size="md" disabled={busy || wait > 0} className="w-full font-bold">
          {busy ? t("loginPending") : t("login")}
        </Button>
      </form>
    </>
  );
}
