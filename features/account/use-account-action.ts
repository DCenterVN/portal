"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { accountErrorMessage } from "@/lib/api/account-client";

export function useAccountAction() {
  const t = useTranslations("account");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function run(action: () => Promise<void>) {
    if (busy) return false;
    setBusy(true);
    setError("");
    try { await action(); return true; }
    catch (cause) { setError(accountErrorMessage(cause, t)); return false; }
    finally { setBusy(false); }
  }
  return { busy, error, run, setError };
}
