"use client";

import { useState } from "react";
import useSWR from "swr";
import { useTranslations } from "next-intl";
import { useAccess } from "@/lib/access-boundary";
import { getSessions, revokeSession, logoutAll, type AccountSession } from "@/lib/api/account-client";
import { toast } from "@/components/ui/toast";
import { useAccountAction } from "./use-account-action";

export function useAccountSessions(userId: string, loginPath: string) {
  const t = useTranslations("account");
  const { scope } = useAccess();
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<AccountSession | "all" | null>(null);
  const action = useAccountAction();
  const state = useSWR(["/api/auth/sessions", page, scope || userId], fetchPage);
  function fetchPage() { return getSessions(page); }
  function previous() { setPage(Math.max(1, page - 1)); }
  function next() { setPage(page + 1); }
  function askAll() { setSelected("all"); }
  function close(open: boolean) { if (!open && !action.busy) setSelected(null); }
  async function revoke() {
    if (selected === "all") {
      await logoutAll();
      window.location.assign(loginPath);
      return;
    }
    if (!selected) return;
    await revokeSession(selected.id);
    setSelected(null);
    toast.success(t("sessionRevoked"));
    await state.mutate();
  }
  async function confirm() { await action.run(revoke); }
  return { ...state, action, page, selected, setSelected, previous, next, askAll, close, confirm };
}
type AgentRule = [RegExp, string];
const browsers: AgentRule[] = [
  [/Edg(?:e|A|iOS)?\//, "Edge"],
  [/(?:Firefox|FxiOS)\//, "Firefox"],
  [/(?:Chrome|CriOS)\//, "Chrome"],
  [/Safari\//, "Safari"],
];
const systems: AgentRule[] = [
  [/Android/, "Android"],
  [/iPhone|iPad/, "iOS"],
  [/Windows/, "Windows"],
  [/Macintosh|Mac OS/, "macOS"],
  [/Linux/, "Linux"],
];
function matchAgent(agent: string, rules: AgentRule[]) {
  for (const [pattern, label] of rules) {
    if (pattern.test(agent)) return label;
  }
  return "";
}
export function sessionDevice(agent = "") {
  const browser = matchAgent(agent, browsers);
  const system = matchAgent(agent, systems);
  return [browser, system].filter(Boolean).join(" · ");
}
