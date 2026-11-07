"use client";

import { useState } from "react";
import { mutate } from "swr";
import { toast } from "@/components/ui/toast";
import { FetchError, mutationFetcher } from "@/lib/fetcher";

export const SESSION_CHANGED = "sunny:console-session-changed";

export function notifySessionChanged() {
  window.dispatchEvent(new Event(SESSION_CHANGED));
}

export function switchFailureMessage(error: unknown): string {
  return error instanceof FetchError && error.status === 403 && error.code === "FORBIDDEN"
    ? "Bạn không còn được vào chi nhánh này"
    : "Hệ thống tạm lỗi, thử lại sau";
}

export function useBranchSwitch(onSwitched: () => Promise<void>) {
  const [busy, setBusy] = useState(false);
  async function select(branchId: string): Promise<boolean> {
    setBusy(true);
    try {
      await mutationFetcher("/api/auth/web/switch-branch", { arg: { branch_id: branchId } });
      await mutate(() => true, undefined, { revalidate: false });
      await onSwitched();
      return true;
    } catch (error) {
      toast.error(switchFailureMessage(error));
      return false;
    } finally {
      setBusy(false);
    }
  }
  return { busy, select };
}
