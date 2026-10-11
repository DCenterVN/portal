"use client";

import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import type { Route } from "next";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { FetchError } from "@/lib/fetcher";
import { login } from "@/lib/api/employee-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { EmptyState, ErrorState } from "@/components/ui/state";
import { cn } from "@/lib/utils";

function loginErrorKey(err: unknown): string {
  if (!(err instanceof FetchError)) return "loginFailed";
  if (err.status === 429 || err.code === "rate_limit_exceeded") return "rateLimited";
  if (err.status === 403 && (err.info as { reason?: string } | undefined)?.reason === "NOT_ACTIVATED") return "notActivated";
  if (err.status === 403 && err.code === "FORBIDDEN") return "notStaff";
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

export function StaffLogin() {
  const t = useTranslations("employeeAuth");
  const id = useId();
  const pending = useRef(false);
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [errorKey, setErrorKey] = useState("");
  const [wait, setWait] = useState(0);
  const [shown, setShown] = useState(false);
  const redirect = useSearchParams()?.get("redirect") ?? undefined;

  useEffect(() => {
    if (wait <= 0) return;
    const timer = setTimeout(() => setWait(wait - 1), 1000);
    return () => clearTimeout(timer);
  }, [wait]);

  const error = errorKey === "rateLimited" && wait > 0 ? t("rateLimitedWait", { seconds: wait }) : errorKey ? t(errorKey) : "";

  async function submit(event: React.FormEvent<HTMLFormElement>) {
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
  }

  const invalid = error ? true : undefined;
  const describedBy = error ? `${id}-error` : undefined;

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: SHAKE_STYLE }} />
      <form noValidate onSubmit={submit} aria-busy={busy} className="space-y-4">
        {!busy && !error && <EmptyState title={t("loginTitle")} description={t("loginSubtitle")} className="py-4" />}
        {error && (
          <div id={`${id}-error`} className="animate-shake">
            <ErrorState
              title={error}
              className="py-4 rounded-lg border-solid border-err/40 bg-err-soft/50 text-err"
              action={
                errorKey === "notStaff" && (
                  <Link href="/login" className="font-semibold text-p-text hover:text-p-hover underline">
                    {t("customerLogin")}
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
            disabled={busy}
            required
            aria-invalid={invalid}
            aria-describedby={describedBy}
            className={cn("h-11 rounded-sm border-line-strong transition-colors duration-150", error && "border-err focus-visible:ring-err")}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={`${id}-password`} className="font-semibold text-sm text-fg">
            {t("password")}
          </Label>
          <div className="relative">
            <Input
              id={`${id}-password`}
              name="password"
              type={shown ? "text" : "password"}
              autoComplete="current-password"
              disabled={busy}
              required
              aria-invalid={invalid}
              aria-describedby={describedBy}
              className={cn("h-11 rounded-sm border-line-strong pr-12 transition-colors duration-150", error && "border-err focus-visible:ring-err")}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label={shown ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
              aria-pressed={shown}
              onClick={() => setShown(!shown)}
              className="absolute top-0 right-0 text-fg-3 hover:text-fg"
            >
              {shown ? <EyeOff aria-hidden="true" className="size-4" /> : <Eye aria-hidden="true" className="size-4" />}
            </Button>
          </div>
        </div>
        <Button
          type="submit"
          size="touch"
          disabled={busy || wait > 0}
          className="w-full text-sm font-bold shadow-sm transition-colors duration-100"
        >
          {busy && <Loader2 aria-hidden="true" className="animate-spin mr-2 size-4" />}
          {busy ? t("loginPending") : t("login")}
        </Button>
        <Link
          href="/staff/forgot-password"
          className="flex min-h-11 items-center justify-center text-sm font-semibold text-p-text hover:text-p-hover hover:underline pt-1"
        >
          {t("forgot")}
        </Link>
      </form>
    </>
  );
}
