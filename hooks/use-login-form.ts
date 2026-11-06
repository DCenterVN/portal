"use client";

import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import type { Route } from "next";
import { useRouter, useSearchParams } from "next/navigation";
import { FetchError } from "@/lib/fetcher";

type LoginConfig = {
  /** Translator of the journey namespace that owns the form copy. */
  t: (key: string, values?: Record<string, string | number>) => string;
  login: (identifier: string, password: string, redirect?: string) => Promise<{ next_path: string }>;
  /** Error key shown for a 403 FORBIDDEN answer (staff: wrong journey); without it the answer is a generic failure. */
  forbiddenKey?: string;
};

function loginErrorKey(err: unknown, forbiddenKey?: string): string {
  if (!(err instanceof FetchError)) return "loginFailed";
  if (err.status === 429 || err.code === "rate_limit_exceeded") return "rateLimited";
  if (err.status === 403 && (err.info as { reason?: string } | undefined)?.reason === "NOT_ACTIVATED") return "notActivated";
  if (forbiddenKey && err.status === 403 && err.code === "FORBIDDEN") return forbiddenKey;
  if (err.status === 401) return "invalidLogin";
  return err.status >= 500 ? "serviceBusy" : "loginFailed";
}

export function useLoginForm({ t, login, forbiddenKey }: LoginConfig) {
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

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
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
      const key = loginErrorKey(err, forbiddenKey);
      setErrorKey(key);
      const ms = err instanceof FetchError ? (err.info as { retry_after_ms?: unknown } | undefined)?.retry_after_ms : undefined;
      if (key === "rateLimited" && typeof ms === "number" && ms > 0) setWait(Math.ceil(ms / 1000));
      requestAnimationFrame(() => form.querySelector<HTMLInputElement>("input")?.focus());
    } finally {
      pending.current = false;
      setBusy(false);
    }
  };

  const text = {
    identifier: t("identifier"), phIdentifier: t("phIdentifier"), password: t("password"), phPassword: t("phPassword"),
    passwordRange: t("passwordRange"), forgot: t("forgot"), login: t("login"), loginPending: t("loginPending"),
  };

  return { id, busy, errorKey, error, locked: wait > 0, redirect, onSubmit, text };
}
