"use client";

import { Suspense, type ReactNode } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { Route } from "next";
import useSWR from "swr";
import { NextIntlClientProvider, useTranslations } from "next-intl";
import messages from "@/messages/vi.json";
import { logoutTo } from "@/lib/auth/client";
import { fetcher } from "@/lib/fetcher";
import { ConsoleShell, type ShellNavItem } from "@/components/layout/console-shell";
import { EmptyState, ErrorState, Skeleton } from "@/components/ui/state";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, Select } from "@/components/ui/field";
import { companyAccess, errorStatus, platformAccess, type AccessState } from "./access";
import { AccessProvider } from "./access-boundary";

type Plane = "platform" | "company";
type NavRule = { href: string; label: string; action: string };
type AccessContextItem = { org_id?: string; org_name?: string; member_type?: string };

const platformNav: NavRule[] = [
  { href: "/platform/companies", label: "companies", action: "platform:org:read" },
  { href: "/platform/support-access", label: "support", action: "platform:support_access:read" },
  { href: "/platform/staff", label: "staff", action: "platform:staff:read" },
  { href: "/platform/audit", label: "audit", action: "platform:audit:read" },
];
const companyNav: NavRule[] = [
  { href: "/company", label: "myCompany", action: "org:company:read" },
  { href: "/company/support-access", label: "companySupport", action: "org:company:read" },
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

function accessKey(plane: Plane, root: string) {
  if (plane === "platform") return "/api/platform/me";
  return root ? `/api/org/permissions/me?org_id=${encodeURIComponent(root)}&branch_id=${encodeURIComponent(root)}` : null;
}

function Gate({ plane, root, children }: { plane: Plane; root: string; children: ReactNode }) {
  const t = useTranslations("platform");
  const { data, error, isLoading, mutate } = useSWR<unknown>(accessKey(plane, root), fetcher, { revalidateOnFocus: true, shouldRetryOnError: false });
  const frame = (body: ReactNode) => <main id="main" className="mx-auto max-w-2xl px-4 py-16">{body}</main>;
  if (isLoading) return frame(<Skeleton title={t("loading")} />);
  const decide = plane === "platform" ? platformAccess : companyAccess;
  const access: AccessState = error ? decide(errorStatus(error), null) : decide(200, data);
  if (access.status !== "ready") {
    if (access.status === "blocked") return frame(<ErrorState title={t("blocked")} onRetry={() => void mutate()} />);
    const description = plane === "platform" ? "Tài khoản không thuộc nhân sự nền tảng." : "Tài khoản không có quyền ở công ty đã chọn.";
    return frame(<ErrorState denied title={t("denied")} description={description} />);
  }
  const nav = navFor(plane, access.actions, root).map((item) => ({ ...item, label: t(item.label) }));
  return (
    <AccessProvider value={{ plane, actions: access.actions, root, role: access.role }}>
      <ConsoleShell
        onLogout={() => void logoutTo("/staff/login")}
        nav={[{ title: plane === "platform" ? t("title") : t("myCompany"), items: nav }]}
        context={{
          label: plane === "platform" ? "Nền tảng" : t("myCompany"),
          sublabel: plane === "company" ? `MAIN ${root}` : undefined,
        }}
        user={{ name: access.role || (plane === "platform" ? "Nhân sự nền tảng" : "Nhân sự công ty") }}
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
  const root = useSearchParams().get("org_id") ?? "";
  if (plane === "company" && !root) return <CompanyPicker />;
  // key: switching company remounts the tree so no data from the previous company survives.
  return (
    <Gate key={root} plane={plane} root={root}>
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
