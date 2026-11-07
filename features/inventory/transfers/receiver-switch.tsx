"use client";

import { useMemo } from "react";
import useSWR from "swr";
import { Button } from "@/components/ui/button";
import { InlineAlert } from "@/components/patterns/inline-alert";
import { notifySessionChanged, useBranchSwitch } from "@/features/console/use-branch-switch";
import { branchChoices } from "@/lib/branch-choices";
import { fetcher } from "@/lib/fetcher";

type ContextPayload = { contexts?: unknown[] };

export function ReceiverSwitch({ receiver, receiverLabel, atSender }: { receiver: string; receiverLabel: string; atSender: boolean }) {
  const { data } = useSWR("/api/auth/context", (url: string) => fetcher<ContextPayload>(url), { revalidateOnFocus: false });
  const allowed = useMemo(() => branchChoices(data?.contexts ?? []).some(branch => branch.id === receiver), [data, receiver]);
  const { busy, select } = useBranchSwitch(async () => notifySessionChanged());
  return (
    <InlineAlert tone="info" className="flex flex-wrap items-center justify-between gap-3">
      <span>
        {atSender ? "Bạn đang ở chi nhánh gửi. " : "Bạn đang xem phiếu này từ chi nhánh khác. "}
        Chỉ chi nhánh nhận mới nhận được hàng. Hãy đổi sang {receiverLabel} để nhận.
      </span>
      {allowed
        ? <Button type="button" size="sm" disabled={busy} onClick={() => void select(receiver)}>{busy ? "Đang đổi…" : `Đổi sang ${receiverLabel}`}</Button>
        : data && <span className="text-xs text-muted-foreground">Tài khoản của bạn không làm việc ở chi nhánh nhận.</span>}
    </InlineAlert>
  );
}
