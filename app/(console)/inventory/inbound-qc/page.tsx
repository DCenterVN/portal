import { Suspense } from "react";
import { BRAND_NAME } from "@/lib/brand";
import { InboundQcView } from "@/features/inventory/inbound-qc/inbound-qc-view";
import { lotListKey, lotListQuery, lotTableState } from "@/features/inventory/inbound-qc/inbound-qc-table";
import { inboundLotParams, lotPageSchema } from "@/lib/api/inbound-qc";
import { inventoryServerGet } from "@/lib/api/inventory-server";

export const metadata = {
  title: `Kiểm đầu vào — ${BRAND_NAME}`,
  description: "Kiểm chất lượng lô nguyên liệu vừa nhận, duyệt hoặc từ chối lô",
};

export default async function InboundQcPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(await searchParams)) for (const item of [value ?? []].flat()) params.append(key, item);
  const lot = params.get("lot") ?? "";
  const state = lotTableState(params);
  const page = lot || lotListQuery(state).status.includes(",") ? undefined : await inventoryServerGet(`/inventory/inventory-lots?${inboundLotParams(lotListQuery(state))}`, lotPageSchema);
  return <Suspense><InboundQcView focusLot={lot} initial={page ? { page, key: lotListKey(state) } : undefined} /></Suspense>;
}
