"use client";

import { useEffect, useState } from "react";
import { useAccess } from "@/lib/access-boundary";
import { getSupplierOverview, type SupplierOverview } from "@/lib/api/supplier-overview";

export function useSupplierOverview(initialOverview?: SupplierOverview) {
  const { can } = useAccess();
  const read = can("inventory:supplier:read");
  const [overview, setOverview] = useState(initialOverview);
  const [loading, setLoading] = useState(!initialOverview);
  const [error, setError] = useState("");
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    if (!read) return;
    let live = true;
    setLoading(true);
    getSupplierOverview().then(value => { if (live) { setOverview(value); setError(""); } }).catch(() => { if (live) setError("Không tải được tổng quan nhà cung cấp"); }).finally(() => { if (live) setLoading(false); });
    return () => { live = false; };
  }, [read, revision]);
  return { read, overview, loading, error, onRetry: () => setRevision(value => value + 1) };
}
