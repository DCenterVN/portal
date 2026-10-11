"use client";

import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import type { Route } from "next";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { FetchError } from "@/lib/fetcher";
import { login } from "@/lib/api/customer-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { EmptyState, ErrorState } from "@/components/ui/state";
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

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: SHAKE_STYLE }} />
      <form onSubmit={onSubmit} noValidate aria-busy={busy} className="space-y-4">
        {!busy && !error && <EmptyState title={t("loginTitle")} description={t("loginSubtitle")} className="py-4" />}
        {error && (
          <div id={`${id}-error`} className="animate-shake">
            <ErrorState
              title={error}
              className="py-4 rounded-lg border-solid border-err/40 bg-err-soft/50 text-err"
              action={
                errorKey === "notActivated" && (
                  <Link href="/activate" className="font-semibold text-p-text hover:text-p-hover underline">
                    {t("resendActivation")}
                  </Link>
                )
              }
            />
          </div>
        )}
        <div className="space-y-1.5">
          <Label htmlFor={`${id}-identifier`} className="font-semibold text-sm text-fg">
            {t("identifier")}
          </Label>
          <Input
            id={`${id}-identifier`}
            name="identifier"
            autoComplete="username"
            required
            disabled={busy}
            aria-invalid={!!error}
            aria-describedby={error ? `${id}-error` : undefined}
            className={cn("h-11 rounded-sm border-line-strong transition-colors duration-150", error && "border-err focus-visible:ring-err")}
          />
        </div>
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor={`${id}-password`} className="font-semibold text-sm text-fg">
              {t("password")}
            </Label>
            <Link
              href="/forgot-password"
              className="flex min-h-11 items-center text-sm font-semibold text-p-text hover:text-p-hover hover:underline"
            >
              {t("forgot")}
            </Link>
          </div>
          <Input
            id={`${id}-password`}
            name="password"
            type="password"
            autoComplete="current-password"
            required
            disabled={busy}
            aria-invalid={!!error}
            aria-describedby={error ? `${id}-error` : undefined}
            className={cn("h-11 rounded-sm border-line-strong transition-colors duration-150", error && "border-err focus-visible:ring-err")}
          />
        </div>
        <Button
          type="submit"
          size="touch"
          disabled={busy || wait > 0}
          className="w-full text-sm font-bold shadow-sm transition-colors duration-100"
        >
          {busy ? t("loginPending") : t("login")}
        </Button>
        <p className="text-center text-sm text-fg-2 pt-1">
          {t("noAccount")}{" "}
          <Link
            href="/register"
            className="inline-flex min-h-11 items-center font-bold text-p-text hover:text-p-hover hover:underline"
          >
            {t("register")}
          </Link>
        </p>
      </form>
    </>
  );
}
