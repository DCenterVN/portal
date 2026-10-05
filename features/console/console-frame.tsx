"use client";

import { useEffect, useState, type ReactNode } from "react";
import { ErrorState } from "@/components/ui/state";
import { ConsoleShell } from "@/components/layout/console-shell";
import { CONSOLE_NAV } from "@/mocks/console";

type ConsoleSession = {
  error?: string;
  user: { name: string; detail?: string };
  context: { label: string; sublabel?: string };
};

const EMPTY_SESSION: ConsoleSession = {
  user: { name: "Tài khoản" },
  context: { label: "Chưa chọn chi nhánh" },
};

function objectValue(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null ? value as Record<string, unknown> : null;
}

export function resolveConsoleSession(profilePayload: unknown, contextPayload: unknown): ConsoleSession {
  const profile = objectValue(profilePayload);
  const context = objectValue(contextPayload);
  const active = objectValue(context?.active_context);
  const contexts = Array.isArray(context?.contexts) ? context.contexts : [];
  const selected = contexts.map(objectValue).find((item) => item?.branch_id === active?.branch_id);

  const name = typeof profile?.display_name === "string" && profile.display_name.trim()
    ? profile.display_name
    : typeof profile?.email === "string" ? profile.email : EMPTY_SESSION.user.name;
  const detail = typeof profile?.email === "string" ? profile.email : undefined;
  const branch = typeof selected?.branch_name === "string" && selected.branch_name.trim()
    ? selected.branch_name
    : EMPTY_SESSION.context.label;
  const organization = typeof selected?.org_name === "string" ? selected.org_name : undefined;

  return { user: { name, detail }, context: { label: branch, sublabel: organization } };
}

export async function fetchConsoleSession(fetcher: typeof fetch = fetch): Promise<ConsoleSession> {
  const results = await Promise.allSettled(["/api/auth/me", "/api/auth/context"].map(async (url) => {
    const response = await fetcher(url);
    if (response.status === 401) return { status: 401, payload: null };
    if (!response.ok) throw new Error("Session request failed");
    return { status: response.status, payload: await response.json() as unknown };
  }));
  if (results.some((result) => result.status === "fulfilled" && result.value.status === 401)) {
    return { user: { name: "Đăng nhập" }, context: { label: "Phiên làm việc hết hạn" }, error: "Phiên làm việc hết hạn. Vui lòng đăng nhập lại." };
  }
  const [profile, context] = results;
  if (profile.status === "rejected" || typeof objectValue(profile.value.payload)?.display_name !== "string") {
    return { ...EMPTY_SESSION, error: "Không tải được phiên làm việc." };
  }
  const session = resolveConsoleSession(profile.value.payload, context.status === "fulfilled" ? context.value.payload : null);
  if (context.status === "rejected" || !objectValue(context.value.payload)) {
    return { ...session, error: "Không tải được phạm vi chi nhánh." };
  }
  return session;
}

export function ConsoleFrame({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<ConsoleSession>(EMPTY_SESSION);

  useEffect(() => {
    let mounted = true;
    void fetchConsoleSession().then((result) => {
      if (mounted) setSession(result);
    });
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <ConsoleShell nav={CONSOLE_NAV} context={session.context} user={session.user}>
      {session.error ? <ErrorState title={session.error} /> : children}
    </ConsoleShell>
  );
}
