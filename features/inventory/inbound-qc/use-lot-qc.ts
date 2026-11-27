"use client";

import { useRef, useState } from "react";
import useSWR from "swr";
import { useAccess } from "@/lib/access-boundary";
import { FetchError } from "@/lib/fetcher";
import { getInboundLot, getInspectionProgress, type InboundLot } from "@/lib/api/inbound-qc";
import { toast } from "@/components/ui/toast";
import { stepDone, stepEnabled, stepTitle, type StepKey } from "./qc-steps";

const failure = (cause: unknown) => cause instanceof FetchError && cause.status === 403 ? "Bạn không có quyền thực hiện bước này" : cause instanceof Error ? cause.message : "Không thực hiện được. Hãy thử lại.";

export function useLotQc(source: InboundLot) {
  const { can } = useAccess();
  const { data: detail, error: detailError, mutate: reloadDetail } = useSWR(["inbound-qc-lot", source.id], () => getInboundLot(source.id));
  const inspection = detail?.inbound_qc_inspection_id ?? "";
  const { data: progress, error: progressError, mutate: reloadProgress } = useSWR(inspection ? ["inbound-qc-inspection", inspection] : null, () => getInspectionProgress(inspection));
  const inspectionError = detailError ?? progressError;
  const [lot, setLot] = useState(source);
  const [session, setSession] = useState<ReadonlySet<StepKey>>(new Set());
  const [active, setActive] = useState<StepKey | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const keys = useRef<Partial<Record<StepKey, string>>>({});
  async function run(step: StepKey, action: (key: string) => Promise<unknown>, patch: Partial<InboundLot> = {}) {
    if (busy) return;
    const key = keys.current[step] ??= crypto.randomUUID();
    setBusy(true); setError("");
    try {
      await action(key);
      delete keys.current[step];
      setSession(previous => new Set(previous).add(step));
      setLot(previous => ({ ...previous, ...patch }));
      setActive(null);
      toast.success(`Đã lưu bước ${stepTitle[step].toLowerCase()}`);
      void reloadDetail();
      void reloadProgress();
    } catch (cause) { setError(failure(cause)); } finally { setBusy(false); }
  }
  const open = (step: StepKey) => { setError(""); setActive(step === active ? null : step); };
  return {
    lot, inspection, progress, inspectionError: Boolean(inspectionError), active, busy, error, run, open,
    enabled: (step: StepKey) => stepEnabled(step, lot, can),
    done: (step: StepKey) => stepDone(step, lot, session, progress),
  };
}
