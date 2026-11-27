import { useMemo } from "react";
import useSWR from "swr";
import { safeMessage } from "@/lib/api/dishes";
import { listSemiFinished, type SemiFinishedItem } from "@/lib/api/semi-finished";

const EMPTY: SemiFinishedItem[] = [];

export function useSemiFinished(enabled = true) {
  const swr = useSWR<SemiFinishedItem[]>(enabled ? "dish-semi-finished" : null, listSemiFinished, { revalidateOnFocus: false });
  const items = swr.data ?? EMPTY;
  const byId = useMemo(() => Object.fromEntries(items.map(item => [item.id, item])), [items]);
  const error = swr.error instanceof Error ? safeMessage(swr.error.message) : swr.error ? "Không tải được danh sách bán thành phẩm" : "";
  return {
    items,
    byId,
    loading: swr.isLoading,
    error,
    reload: () => swr.mutate(),
    prepend: async (created: SemiFinishedItem) => {
      await swr.mutate(current => [created, ...(current ?? []).filter(item => item.id !== created.id)], { revalidate: false });
    },
  };
}
