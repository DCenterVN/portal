"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { NextIntlClientProvider } from "next-intl";
import messages from "@/messages/vi.json";
import { AccessProvider } from "@/lib/access-boundary";
import type { AccessScope } from "@/lib/access-context";
import { ErrorState, LoadingState } from "@/components/patterns/empty-state";
import { ConsoleShell } from "@/components/layout/console-shell";
import { branchChoices } from "@/lib/branch-choices";
import { branchLabel, type BranchChoice } from "@/lib/branch-label";
import { logoutTo } from "@/lib/auth/client";
import { toast } from "@/components/ui/toast";
import { consoleNavFor, consoleRouteAllowed } from "@/lib/navigation";
import { SESSION_CHANGED, useBranchSwitch } from "./use-branch-switch";

type ConsoleSession = {
  error?: string;
  user: { name: string; detail?: string };
  context: { label: string; sublabel?: string };
  branch?: BranchChoice;
  branches: BranchChoice[];
  permissions?: string[];
  scope?: AccessScope;
};

const EMPTY_SESSION: ConsoleSession = {
  user: { name: "Tài khoản" },
  context: { label: "Chưa chọn chi nhánh" },
  branches: [],
};

const isStringArray = (value: unknown): value is string[] => Array.isArray(value) && value.every((item) => typeof item === "string");

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

  const permissions = isStringArray(context?.permissions) ? context.permissions : [];
  const branches = branchChoices(contexts);
  const current = branches.find((choice) => choice.id === active?.branch_id);
  const session: ConsoleSession = { user: { name, detail }, context: { label: branch, sublabel: organization }, branches, branch: current, permissions };
  if (typeof profile?.id === "string" && typeof active?.org_id === "string" && typeof active?.branch_id === "string") {
    const roles = Array.isArray(selected?.roles) ? selected.roles.filter((role): role is string => typeof role === "string") : [];
    session.scope = { userId: profile.id, orgId: active.org_id, branchId: active.branch_id, branchName: current ? branchLabel(current) : branch, roles };
  }
  return session;
}

export async function fetchConsoleSession(fetcher: typeof fetch = fetch): Promise<ConsoleSession> {
  let response: Response;
  let payload: unknown;
  try {
    response = await fetcher("/api/auth/context");
    if (response.status === 401) {
      return { user: { name: "Đăng nhập" }, context: { label: "Phiên làm việc hết hạn" }, branches: [], error: "Phiên làm việc hết hạn. Vui lòng đăng nhập lại." };
    }
    payload = await response.json();
  } catch {
    return { ...EMPTY_SESSION, error: "Không tải được phiên làm việc." };
  }
  const context = objectValue(payload);
  const profile = objectValue(context?.user);
  if (typeof profile?.display_name !== "string") {
    return { ...EMPTY_SESSION, error: "Không tải được phiên làm việc." };
  }
  const session = resolveConsoleSession(profile, context);
  if (!response.ok) {
    return { ...session, error: "Không tải được phạm vi chi nhánh." };
  }
  if (context?.permissions !== undefined && !isStringArray(context.permissions)) {
    return { ...session, error: messages.memberships.permissionError };
  }
  return session;
}

export function ConsoleFrame({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<ConsoleSession>(EMPTY_SESSION);
  const { busy, select } = useBranchSwitch(async () => setSession(await fetchConsoleSession()));

  useEffect(() => {
    let mounted = true;
    void fetchConsoleSession().then((result) => {
      if (mounted) setSession(result);
    });
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    function reload() {
      void fetchConsoleSession().then(setSession);
    }
    window.addEventListener(SESSION_CHANGED, reload);
    return () => window.removeEventListener(SESSION_CHANGED, reload);
  }, []);

  const pathname = usePathname() ?? "";
  const actions = useMemo(() => new Set(session.permissions), [session.permissions]);
  const nav = useMemo(() => consoleNavFor(actions), [actions]);
  const body = session.error ? <ErrorState title={session.error} />
    : !session.permissions ? <LoadingState title={messages.memberships.loading} />
    : consoleRouteAllowed(pathname, actions) ? children
    : <ErrorState denied title="Không có quyền truy cập" description="Tài khoản của bạn chưa được cấp quyền xem trang này. Liên hệ quản trị viên để được cấp quyền." />;

  const branchSwitch = session.branch ? { branch: session.branch, branches: session.branches, busy, onSelect: (id: string) => void select(id) } : undefined;

  return (
    <ConsoleShell nav={nav} context={session.context} user={session.user} branchSwitch={branchSwitch} onLogout={() => void logoutTo("/staff/login", toast.error)}>
      <NextIntlClientProvider key={session.scope?.branchId} locale="vi" messages={messages}>
        <AccessProvider value={{ plane: "company", actions, root: "", scope: session.scope }}>{body}</AccessProvider>
      </NextIntlClientProvider>
    </ConsoleShell>
  );
}
