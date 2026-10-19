"use client";

import { Suspense, type ReactNode } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { Route } from "next";
import useSWR from "swr";
import { NextIntlClientProvider, useTranslations } from "next-intl";
import messages from "@/messages/vi.json";
import { logoutTo } from "@/lib/auth/client";
import { useToast } from "@/components/ui/toast";
import { fetcher } from "@/lib/fetcher";
import { ConsoleShell, type ShellNavItem } from "@/components/layout/console-shell";
import { EmptyState, ErrorState, Skeleton } from "@/components/ui/state";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, Select } from "@/components/ui/field";
import { companyAccess, errorStatus, platformAccess, type AccessState } from "./access";
import { AccessProvider } from "./access-boundary";

type Plane = "platform" | "company";
type NavRule = { href: string; label: string; action: string };
type AccessContextItem = { org_id?: string; org_name?: string; branch_id?: string; member_type?: string; status?: string };

const platformNav: NavRule[] = [
  { href: "/platform/role-matrix", label: "roleMatrix", action: "org:role:update" },
  { href: "/platform/audit", label: "audit", action: "org:company:read" },
];
const companyNav: NavRule[] = [
  { href: "/company", label: "myCompany", action: "org:company:read" },
];

export function navFor(plane: Plane, actions: ReadonlySet<string>, root: string): ShellNavItem[] {
  const rules = plane === "platform" ? platformNav : companyNav;
  const suffix = plane === "company" ? `?org_id=${encodeURIComponent(root)}` : "";
  return rules.filter((rule) => actions.has(rule.action)).map((rule) => ({ href: `${rule.href}${suffix}`, label: rule.label, match: rule.href }));
}

// ponytail: company = MAIN branch; one row per org_id among employee contexts.
export function companyChoices(contexts: AccessContextItem[] = []) {
  const seen = new Map<string, string>();
  for (const item of contexts) {
    if (item.member_type === "EMPLOYEE" && item.org_id && !seen.has(item.org_id)) seen.set(item.org_id, item.org_name || item.org_id);
  }
  return [...seen].map(([id, name]) => ({ id, name }));
}

function accessKey(root: string, branch: string) {
  return root && branch ? `/api/org/permissions/me?org_id=${encodeURIComponent(root)}&branch_id=${encodeURIComponent(branch)}` : null;
}

function Gate({ plane, root, branch = root, children }: { plane: Plane; root: string; branch?: string; children: ReactNode }) {
  const { toast } = useToast();
  const t = useTranslations("platform");
  const { data, error, isLoading, mutate } = useSWR<unknown>(accessKey(root, branch), fetcher, { revalidateOnFocus: true, shouldRetryOnError: false });
  const frame = (body: ReactNode) => <main id="main" className="mx-auto max-w-2xl px-4 py-16">{body}</main>;
  if (isLoading) return frame(<Skeleton title={t("loading")} />);
  const decide = plane === "platform" ? platformAccess : companyAccess;
  const access: AccessState = error ? decide(errorStatus(error), null) : decide(200, data);
  if (access.status !== "ready") {
    if (access.status === "blocked") return frame(<ErrorState title={t("blocked")} onRetry={() => void mutate()} />);
    const description = plane === "platform" ? "Tài khoản không có quyền quản trị." : "Tài khoản không có quyền ở công ty đã chọn.";
    return frame(<ErrorState denied title={t("denied")} description={description} />);
  }
  const nav = navFor(plane, access.actions, root).map((item) => ({ ...item, label: t(item.label) }));
  return (
    <AccessProvider value={{ plane, actions: access.actions, root, role: access.role }}>
      <ConsoleShell
        accountHref={plane === "platform" ? "/platform/account" : "/company/account"}
        onLogout={() => void logoutTo("/staff/login", toast.error)}
        nav={[{ title: plane === "platform" ? t("title") : t("myCompany"), items: nav }]}
        context={{
          label: plane === "platform" ? "Nền tảng" : t("myCompany"),
          sublabel: plane === "company" ? `MAIN ${root}` : undefined,
        }}
        user={{ name: access.role || (plane === "platform" ? "Quản trị viên" : "Nhân sự công ty") }}
      >
        {children}
      </ConsoleShell>
    </AccessProvider>
  );
}

function CompanyPicker() {
  const router = useRouter();
  const { data, error, isLoading, mutate } = useSWR<{ contexts?: AccessContextItem[] }>("/api/auth/context", fetcher, { shouldRetryOnError: false });
  const frame = (body: ReactNode) => <main id="main" className="mx-auto max-w-xl px-4 py-16">{body}</main>;
  if (isLoading) return frame(<Skeleton title="Đang tải các công ty của bạn…" />);
  if (error) return frame(<ErrorState title="Không tải được phạm vi tổ chức." description="Truy cập bị chặn cho tới khi tổ chức trả lời." onRetry={() => void mutate()} />);
  const choices = companyChoices(data?.contexts);
  if (choices.length === 0) return frame(<EmptyState title="Bạn chưa là nhân viên của công ty nào." description="Khách hàng không mở được khu quản trị công ty." />);
  return frame(
    <Card>
      <CardHeader>
        <CardTitle>Chọn công ty</CardTitle>
        <CardDescription>Tổ chức sẽ kiểm quyền của bạn ở chi nhánh MAIN của công ty được chọn.</CardDescription>
      </CardHeader>
      <CardContent>
        <Field label="Công ty" htmlFor="company-picker">
          <Select id="company-picker" defaultValue="" onChange={(event) => router.replace(`/company?org_id=${encodeURIComponent(event.target.value)}` as Route)}>
            <option value="" disabled>
              Chọn công ty
            </option>
            {choices.map((choice) => (
              <option key={choice.id} value={choice.id}>
                {choice.name}
              </option>
            ))}
          </Select>
        </Field>
      </CardContent>
    </Card>
  );
}

function Inner({ plane, children }: { plane: Plane; children: ReactNode }) {
  const selectedRoot = useSearchParams().get("org_id") ?? "";
  const { data, error, isLoading, mutate } = useSWR<{ contexts?: AccessContextItem[] }>(plane === "platform" ? "/api/auth/context" : null, fetcher, { shouldRetryOnError: false });
  if (plane === "company" && !selectedRoot) return <CompanyPicker />;
  if (plane === "platform" && isLoading) return <Skeleton title="Đang xác minh quyền truy cập…" />;
  if (plane === "platform" && error) return <ErrorState title="Không thể xác minh quyền." onRetry={() => void mutate()} />;
  const context = data?.contexts?.find((item) => item.member_type === "EMPLOYEE" && (!item.status || item.status === "ACTIVE") && item.org_id && item.branch_id);
  if (plane === "platform" && !context) return <ErrorState denied title="Tài khoản này không có quyền mở nội dung." />;
  const root = plane === "platform" ? context?.org_id ?? "" : selectedRoot;
  return (
    <Gate key={root} plane={plane} root={root} branch={plane === "platform" ? context?.branch_id : root}>
      {children}
    </Gate>
  );
}

// Client-side provider: the app has no next-intl request config, so the provider must not live in a server layout.
function Workspace({ plane, children }: { plane: Plane; children: ReactNode }) {
  return (
    <NextIntlClientProvider locale="vi" messages={messages} timeZone="Asia/Ho_Chi_Minh">
      <Suspense fallback={<main id="main" className="mx-auto max-w-2xl px-4 py-16"><Skeleton title="Đang xác minh quyền truy cập…" /></main>}>
        <Inner plane={plane}>{children}</Inner>
      </Suspense>
    </NextIntlClientProvider>
  );
}

export function PlatformWorkspace({ children }: { children: ReactNode }) {
  return <Workspace plane="platform">{children}</Workspace>;
}

export function CompanyWorkspace({ children }: { children: ReactNode }) {
  return <Workspace plane="company">{children}</Workspace>;
}
