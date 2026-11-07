"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState, ErrorState } from "@/components/patterns/empty-state";
import { FetchError } from "@/lib/fetcher";
import type { UserProfile } from "@/lib/auth/client";
import { accountErrorMessage } from "@/lib/api/account-client";
import { useAccount } from "./use-account";

type AccountGateProps = { staff?: boolean; children: (profile: UserProfile, refresh: () => Promise<void>) => ReactNode };

export function AccountGate({ staff = false, children }: AccountGateProps) {
  const t = useTranslations("account");
  const account = useAccount();
  if (account.isLoading) return <div role="status" aria-label={t("loading")} className="space-y-4"><span className="sr-only">{t("loading")}</span><Skeleton className="h-24 w-full" /><Skeleton className="h-64 w-full" /></div>;
  if (account.error) return <>
    <ErrorState title={accountErrorMessage(account.error, t)} onRetry={account.mutate} />
    {account.error instanceof FetchError && account.error.status === 401 && <Button asChild variant="outline"><Link href={staff ? "/staff/login" : "/login"}>{t(staff ? "staffLogin" : "customerLogin")}</Link></Button>}
  </>;
  if (!account.data) return <EmptyState title={t("notFound")} />;
  return <>{children(account.data, account.refresh)}</>;
}
