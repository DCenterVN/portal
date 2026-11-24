"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useTableUrlState } from "@/components/patterns/data-table/use-table-url-state";
import { useAccess } from "@/lib/access-boundary";
import { getMaterialCategories } from "@/lib/api/material-categories";
import { getSupplierOverview, type SupplierOverview } from "@/lib/api/supplier-overview";
import { getSuppliers, type SupplierPage } from "@/lib/api/suppliers";
import type { MaterialCategory } from "@/lib/api/inventory/types";
import type { SupplierAttention } from "./supplier-overview-view";
import { supplierListKey, supplierListQuery, supplierTableConfig } from "./suppliers-table";

export type SuppliersInitial = {
  page: SupplierPage;
  key: string;
  categories: MaterialCategory[];
  overview?: SupplierOverview;
};

export function useSuppliers(initial?: SuppliersInitial) {
  const { can } = useAccess();
  const read = can("inventory:supplier:read") || Boolean(initial);
  const url = useTableUrlState(supplierTableConfig);
  const searchParams = useSearchParams();
  const [page, setPage] = useState(initial?.page);
  const [loading, setLoading] = useState(!initial);
  const [error, setError] = useState("");
  const [revision, setRevision] = useState(0);
  const [expanded, setExpanded] = useState<string[]>([]);
  const [overview, setOverview] = useState<SupplierOverview | undefined>(initial?.overview);
  const [overviewLoading, setOverviewLoading] = useState(Boolean(read && !initial?.overview));
  const [overviewError, setOverviewError] = useState("");
  const [overviewRevision, setOverviewRevision] = useState(0);

  const rawAttention = url.state.filters.attention?.[0] ?? searchParams.get("attention");
  const attention: SupplierAttention = rawAttention === "without_price" || rawAttention === "expiring" ? rawAttention : "";

  const toggle = (id: string) => setExpanded(items => items.includes(id) ? items.filter(item => item !== id) : [...items, id]);

  const key = supplierListKey(url.state);
  const skip = useRef(initial?.key);
  useEffect(() => {
    if (!read) return;
    if (skip.current === key && revision === 0) { skip.current = undefined; return; }
    skip.current = undefined;
    let live = true;
    setLoading(true);
    getSuppliers(supplierListQuery(url.state))
      .then(value => { if (live) { setPage(value); setError(""); } })
      .catch(() => { if (live) setError("Không tải được danh sách nhà cung cấp"); })
      .finally(() => { if (live) setLoading(false); });
    return () => { live = false; };
  }, [key, read, revision]);

  const totalPages = page?.pagination?.total_pages;
  useEffect(() => {
    if (!loading && totalPages !== undefined && url.state.page > Math.max(1, totalPages)) url.setPage(Math.max(1, totalPages));
  }, [loading, totalPages, url.state.page]);

  const [categories, setCategories] = useState<MaterialCategory[]>(initial?.categories ?? []);
  useEffect(() => {
    if (!read || initial?.categories.length) return;
    let live = true;
    getMaterialCategories().then(items => { if (live) setCategories(items); }).catch(() => undefined);
    return () => { live = false; };
  }, [read, initial?.categories.length]);

  useEffect(() => {
    if (!read || (initial?.overview && revision === 0 && overviewRevision === 0)) {
      setOverviewLoading(false);
      return;
    }
    let live = true;
    setOverviewLoading(true);
    setOverviewError("");
    getSupplierOverview()
      .then(value => {
        if (live) {
          setOverview(value);
          setOverviewError("");
        }
      })
      .catch(() => {
        if (live) setOverviewError("Không tải được tổng quan nhà cung cấp");
      })
      .finally(() => {
        if (live) setOverviewLoading(false);
      });
    return () => { live = false; };
  }, [read, initial?.overview, revision, overviewRevision]);

  return {
    can,
    read,
    url,
    page,
    rows: page?.items,
    categories,
    overview,
    overviewLoading,
    overviewError,
    reloadOverview: () => setOverviewRevision(value => value + 1),
    attention,
    loading,
    error,
    setRevision,
    expanded,
    toggle,
  };
}
