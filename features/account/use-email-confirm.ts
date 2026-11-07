"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { confirmEmailChange } from "@/lib/api/account-client";
import { useAccountAction } from "./use-account-action";

export function useEmailConfirm() {
  const t = useTranslations("account");
  const initialized = useRef(false);
  const [token, setToken] = useState("");
  const [ready, setReady] = useState(false);
  const [done, setDone] = useState(false);
  const action = useAccountAction();
  useEffect(readToken, []);
  function readToken() {
    if (initialized.current) return;
    initialized.current = true;
    const url = new URL(window.location.href);
    setToken(url.searchParams.get("token") || "");
    url.searchParams.delete("token");
    window.history.replaceState(window.history.state, "", `${url.pathname}${url.search}${url.hash}`);
    setReady(true);
  }
  async function confirm() {
    await confirmEmailChange({ token });
    setToken("");
    setDone(true);
  }
  async function submit() { if (token) await action.run(confirm); }
  return { token, ready, done, submit, t, ...action };
}
