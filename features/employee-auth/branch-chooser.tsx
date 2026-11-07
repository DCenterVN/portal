"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import useSWR from "swr";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { BranchList } from "@/components/patterns/branch-list";
import { EmptyState, ErrorState, LoadingState } from "@/components/patterns/empty-state";
import { useBranchSwitch } from "@/features/console/use-branch-switch";
import { branchChoices } from "@/lib/branch-choices";
import { branchLabel } from "@/lib/branch-label";
import { fetcher } from "@/lib/fetcher";
import { cn } from "@/lib/utils";

type ContextPayload = { contexts?: unknown[]; active_context?: { branch_id?: string } };

export function BranchChooser() {
  const t = useTranslations("employeeAuth");
  const router = useRouter();
  const { data, error, mutate } = useSWR("/api/auth/context", (url: string) => fetcher<ContextPayload>(url), { revalidateOnFocus: false });
  const branches = useMemo(() => branchChoices(data?.contexts ?? []), [data]);
  const { busy, select } = useBranchSwitch(async () => { router.push("/console"); router.refresh(); });
  const only = branches.length === 1 ? branches[0] : undefined;
  const [stuck, setStuck] = useState(false);
  const entered = useRef(false);

  const enter = (branchId: string) => select(branchId).then((ok) => setStuck(!ok));
  useEffect(() => {
    if (!only || entered.current) return;
    entered.current = true;
    void enter(only.id);
  }, [only]);

  if (!data) return error ? <ErrorState title={t("contextFailed")} onRetry={() => void mutate()} /> : <LoadingState title={t("contextPending")} />;
  if (!branches.length) return <EmptyState title={t("noBranch")} action={<Link href="/staff/login" className="text-primary underline-offset-4 hover:underline">{t("login")}</Link>} />;
  if (only) {
    return stuck
      ? <ErrorState title={t("enterFailed", { name: branchLabel(only) })} onRetry={() => { setStuck(false); void enter(only.id); }} />
      : <LoadingState title={t("branchEntering", { name: branchLabel(only) })} />;
  }
  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">{t("branchHint")}</p>
      <div aria-busy={busy} className={cn("overflow-hidden rounded-lg border border-border bg-card", busy && "pointer-events-none opacity-60")}>
        <BranchList branches={branches} currentId={data.active_context?.branch_id} onPick={(id) => void enter(id)} />
      </div>
    </div>
  );
}
