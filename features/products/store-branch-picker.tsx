"use client";

import useSWR from "swr";
import { z } from "zod";
import { useRouter, useSearchParams } from "next/navigation";
import type { Route } from "next";
import { EntityPicker } from "@/components/patterns/entity-picker";
import { fetcher } from "@/lib/fetcher";

const branches = z.array(z.object({ id: z.string().uuid(), name: z.string() }));
export function StoreBranchPicker() {
  const router = useRouter();
  const search = useSearchParams();
  const { data, error, mutate } = useSWR("/api/public/branches", async path => branches.parse(await fetcher<unknown>(path)));
  return <div className="mx-auto mt-6 w-full max-w-7xl px-6"><div className="max-w-sm"><EntityPicker label="Chi nhánh mua hàng" name="store-branch" serializeValue={false}
    items={data} status={error ? "error" : data ? "ready" : "loading"} value={search.get("branch_id")}
    getId={branch => branch.id} getLabel={branch => branch.name} onRetry={() => void mutate()}
    onChange={id => {
      const next = new URLSearchParams(search.toString());
      if (id) next.set("branch_id", id); else next.delete("branch_id");
      next.delete("cursor");
      router.replace(`/products?${next}` as Route, { scroll: false });
    }} /></div></div>;
}
