"use client";

import { useEffect, useRef, useState } from "react";
import useSWR from "swr";
import { useTableUrlState } from "@/components/patterns/data-table/use-table-url-state";
import { useAccess } from "@/lib/access-boundary";
import { useContractMaterials } from "../use-contract-materials";
import { getInboundLot, getInboundLots, type InboundLot, type InboundLotPage } from "@/lib/api/inbound-qc";
import { getStorageLocations } from "@/lib/api/storage-locations";
import { lotListKey, lotListQuery, lotTableConfig } from "./inbound-qc-table";

export type InboundLotsInitial = { page: InboundLotPage; key: string };

export function useInboundQc(focusLot: string, initial?: InboundLotsInitial) {
  const { can } = useAccess();
  const allowed = can("inventory:lot:read") && can("inventory:qc:update");
  const url = useTableUrlState(lotTableConfig);
  const [page, setPage] = useState(initial?.page);
  const [loading, setLoading] = useState(!initial);
  const [error, setError] = useState("");
  const [revision, setRevision] = useState(0);
  const key = lotListKey(url.state);
  const skip = useRef(initial?.key);
  useEffect(() => {
    if (!allowed) return;
    if (skip.current === key && revision === 0) { skip.current = undefined; return; }
    skip.current = undefined;
    let live = true;
    setLoading(true);
    getInboundLots(lotListQuery(url.state)).then(value => { if (live) { setPage(value); setError(""); } }).catch(() => { if (live) setError("Không tải được danh sách lô"); }).finally(() => { if (live) setLoading(false); });
    return () => { live = false; };
  }, [key, allowed, revision]);
  const totalPages = page?.pagination?.total_pages;
  useEffect(() => {
    if (!loading && totalPages !== undefined && url.state.page > Math.max(1, totalPages)) url.setPage(Math.max(1, totalPages));
  }, [loading, totalPages, url.state.page]);
  const { materials } = useContractMaterials(allowed);
  const { data: focused } = useSWR(allowed && focusLot ? ["inbound-qc-lot", focusLot] : null, () => getInboundLot(focusLot));
  const { data: locations } = useSWR(allowed ? "storage-locations-catalog" : null, () => getStorageLocations({ page: 1, limit: 100 }));
  const catalog = locations && Object.fromEntries(locations.items.map(item => [item.code, item]));
  const [picked, setPicked] = useState<InboundLot | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const names = Object.fromEntries((materials ?? []).map(item => [item.id, item.name]));
  const selected = picked ?? (dismissed ? null : focused ?? null);
  return {
    allowed, url, page, catalog, rows: page?.items, loading, error, selected,
    reload: () => setRevision(value => value + 1),
    nameOf: (lot: InboundLot) => names[lot.sku_ref] ?? "Nguyên liệu",
    select: setPicked,
    back: () => { setPicked(null); setDismissed(true); setRevision(value => value + 1); },
  };
}
