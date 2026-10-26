"use client";

import { useEffect, useState } from "react";
import { useAccess } from "@/lib/access-boundary";
import { getSuppliers, type SupplierPage } from "@/lib/api/suppliers";

export function useSuppliers(initialPage?: SupplierPage) {
  const { can } = useAccess();
  const read = can("inventory:supplier:read");
  const [page, setPage] = useState(initialPage);
  const [loading, setLoading] = useState(!initialPage);
  const [error, setError] = useState("");
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [cursors, setCursors] = useState([""]);
  const [create, setCreate] = useState(false);
  const [revision, setRevision] = useState(0);
  const cursor = cursors[cursors.length - 1];
  useEffect(() => {
    if (!read) return;
    let live = true;
    setLoading(true);
    const timer = setTimeout(() => {
      getSuppliers({ q, status, cursor }).then(value => { if (live) { setPage(value); setError(""); } }).catch(() => { if (live) setError("Không tải được danh sách nhà cung cấp"); }).finally(() => { if (live) setLoading(false); });
    }, 250);
    return () => { live = false; clearTimeout(timer); };
  }, [q, status, cursor, read, revision]);
  return { can, read, page, loading, error, q, status, cursors, create, setCreate, setQ, setStatus, setCursors, setRevision };
}
