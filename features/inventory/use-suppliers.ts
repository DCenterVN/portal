"use client";

import { useEffect, useRef, useState } from "react";
import { useTableUrlState } from "@/components/patterns/data-table/use-table-url-state";
import { useAccess } from "@/lib/access-boundary";
import { getSuppliers, type SupplierPage } from "@/lib/api/suppliers";
import { getMaterialCategories } from "@/lib/api/material-categories";
import type { MaterialCategory } from "@/lib/api/inventory/types";
import { supplierListKey, supplierListQuery, supplierTableConfig } from "./suppliers-table";

export type SuppliersInitial = { page: SupplierPage; key: string; categories: MaterialCategory[] };

export function useSuppliers(initial?: SuppliersInitial) {
  const { can } = useAccess();
  const read = can("inventory:supplier:read") || Boolean(initial);
  const url = useTableUrlState(supplierTableConfig);
  const [page, setPage] = useState(initial?.page);
  const [loading, setLoading] = useState(!initial);
  const [error, setError] = useState("");
  const [revision, setRevision] = useState(0);
  const [expanded, setExpanded] = useState<string[]>([]);
  const toggle = (id: string) => setExpanded(items => items.includes(id) ? items.filter(item => item !== id) : [...items, id]);
  const key = supplierListKey(url.state);
  const skip = useRef(initial?.key);
  useEffect(() => {
    if (!read) return;
    if (skip.current === key && revision === 0) { skip.current = undefined; return; }
    skip.current = undefined;
    let live = true;
    setLoading(true);
    getSuppliers(supplierListQuery(url.state)).then(value => { if (live) { setPage(value); setError(""); } }).catch(() => { if (live) setError("Không tải được danh sách nhà cung cấp"); }).finally(() => { if (live) setLoading(false); });
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
  return { can, read, url, page, rows: page?.items, categories, loading, error, setRevision, expanded, toggle };
}
