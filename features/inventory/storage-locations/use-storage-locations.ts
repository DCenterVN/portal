"use client";

import { useEffect, useState } from "react";
import { useTableUrlState } from "@/components/patterns/data-table/use-table-url-state";
import { useAccess } from "@/lib/access-boundary";
import { getStorageLocations, type StorageLocationPage } from "@/lib/api/storage-locations";
import { locationListKey, locationListQuery, locationTableConfig } from "./storage-locations-table";

export function useStorageLocations() {
  const { can } = useAccess();
  const read = can("inventory:lot:read");
  const url = useTableUrlState(locationTableConfig);
  const [page, setPage] = useState<StorageLocationPage>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [revision, setRevision] = useState(0);
  const key = locationListKey(url.state);
  useEffect(() => {
    if (!read) return;
    let live = true;
    setLoading(true);
    getStorageLocations(locationListQuery(url.state)).then(value => { if (live) { setPage(value); setError(""); } }).catch(() => { if (live) setError("Không tải được danh sách vị trí kho"); }).finally(() => { if (live) setLoading(false); });
    return () => { live = false; };
  }, [key, read, revision]);
  const totalPages = page?.pagination?.total_pages;
  useEffect(() => {
    if (!loading && totalPages !== undefined && url.state.page > Math.max(1, totalPages)) url.setPage(Math.max(1, totalPages));
  }, [loading, totalPages, url.state.page]);
  return { can, read, url, page, rows: page?.items, loading, error, reload: () => setRevision(value => value + 1) };
}
