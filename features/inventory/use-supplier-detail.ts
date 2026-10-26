"use client";

import { useEffect, useState } from "react";
import { useAccess } from "@/lib/access-boundary";
import { getSupplier, suspendSupplier, type Supplier } from "@/lib/api/suppliers";
import { FetchError } from "@/lib/fetcher";

export type SupplierDetailOptions = { supplierId: string; initialSupplier?: Supplier; initialTab?: "overview" | "agreements" };
export function useSupplierDetail({ supplierId, initialSupplier, initialTab = "overview" }: SupplierDetailOptions) {
  const { can } = useAccess();
  const read = can("inventory:supplier:read");
  const [supplier, setSupplier] = useState(initialSupplier);
  const [tab, setTab] = useState(initialTab);
  const [error, setError] = useState("");
  const [notFound, setNotFound] = useState(false);
  const [edit, setEdit] = useState(false);
  const [changeStatus, setChangeStatus] = useState(false);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    if (!read) return;
    let live = true;
    setSupplier(initialSupplier?.id === supplierId ? initialSupplier : undefined);
    setError(""); setNotFound(false);
    getSupplier(supplierId).then(value => { if (live) { setSupplier(value); setError(""); setNotFound(false); } }).catch(cause => { if (live) { if (cause instanceof FetchError && cause.status === 404) { setSupplier(undefined); setNotFound(true); } else setError("Không tải được nhà cung cấp"); } });
    return () => { live = false; };
  }, [supplierId, read, revision, initialSupplier]);
  async function change() {
    if (!supplier || !reason.trim() || busy || !can("inventory:supplier:update")) return;
    setBusy(true);
    try { setSupplier(await suspendSupplier(supplierId, supplier.status === "ACTIVE" ? "SUSPEND" : "ACTIVATE", reason.trim())); setChangeStatus(false); setReason(""); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Không thay đổi được trạng thái"); }
    finally { setBusy(false); }
  }
  return { supplierId, can, read, supplier, tab, setTab, error, notFound, edit, setEdit, changeStatus, setChangeStatus, reason, setReason, busy, setRevision, setSupplier, change };
}
