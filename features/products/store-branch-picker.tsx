"use client";

import useSWR from "swr";
import { useRouter, useSearchParams } from "next/navigation";
import type { Route } from "next";
import { EntityPicker } from "@/components/patterns/entity-picker";
import { fetcher } from "@/lib/fetcher";
import type { StoreBranch } from "./store-branches";

export const useStoreBranches = () => useSWR("/api/public/branches", path => fetcher<StoreBranch[]>(path));

export function StoreBranchPicker() {
  const router = useRouter();
  const search = useSearchParams();
  const { data, error, mutate } = useStoreBranches();
  return <div className="mx-auto mt-6 w-full max-w-7xl px-6"><div className="max-w-sm"><EntityPicker label="Chi nhánh mua hàng" name="store-branch" serializeValue={false}
    items={data} status={error ? "error" : data ? "ready" : "loading"} value={search.get("branch_id")}
    getId={branch => branch.id} getLabel={branch => branch.name} getMeta={branch => branch.kind} emptyText="Hiện chưa có cửa hàng nào mở bán. Vui lòng quay lại sau." onRetry={() => void mutate()}
    onChange={id => {
      const next = new URLSearchParams(search.toString());
      if (id) next.set("branch_id", id); else next.delete("branch_id");
      next.delete("cursor");
      router.replace(`/products?${next}` as Route, { scroll: false });
    }} /></div></div>;
}
