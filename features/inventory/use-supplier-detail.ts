"use client";

import { useEffect, useState } from "react";
import { useAccess } from "@/lib/access-boundary";
import { getSupplier, suspendSupplier, type Supplier } from "@/lib/api/suppliers";
import { toast } from "@/components/ui/toast";
import { FetchError } from "@/lib/fetcher";
import { downloadSupplierPhoto } from "@/lib/api/supplier-photo";
import { supplierReasonNoteRequired } from "./supplier-suspend";

export async function loadSupplierPhoto(supplier: Supplier | undefined, read: boolean): Promise<string> {
  if (!read || !supplier?.photo) return "";
  return downloadSupplierPhoto(supplier.id).catch(() => "");
}

export type SupplierDetailOptions = { supplierId: string; initialSupplier?: Supplier; initialStatusDialog?: boolean };
export function useSupplierDetail({ supplierId, initialSupplier, initialStatusDialog = false }: SupplierDetailOptions) {
  const { can } = useAccess();
  const read = can("inventory:supplier:read");
  const [supplier, setSupplier] = useState(initialSupplier);
  const [error, setError] = useState("");
  const [notFound, setNotFound] = useState(false);
  const [changeStatus, setChangeStatusOpen] = useState(initialStatusDialog);
  const [reasonCode, setReasonCode] = useState("");
  const [reason, setReason] = useState("");
  const [statusError, setStatusError] = useState("");
  const [busy, setBusy] = useState(false);
  const [revision, setRevision] = useState(0);
  const [photo, setPhoto] = useState({ identity: "", url: "" });
  const photoIdentity = read && supplier?.id === supplierId && supplier.photo ? `${supplierId}:${supplier.photo.updated_at}` : "";
  useEffect(() => {
    let live = true;
    if (photoIdentity) loadSupplierPhoto(supplier, read).then(url => { if (live) setPhoto({ identity: photoIdentity, url }); });
    return () => { live = false; };
  }, [photoIdentity, supplier, read]);
  useEffect(() => {
    if (!read) return;
    let live = true;
    setSupplier(initialSupplier?.id === supplierId ? initialSupplier : undefined);
    setError(""); setNotFound(false);
    getSupplier(supplierId).then(value => { if (live) { setSupplier(value); setError(""); setNotFound(false); } }).catch(cause => { if (live) { if (cause instanceof FetchError && cause.status === 404) { setSupplier(undefined); setNotFound(true); } else setError("Không tải được nhà cung cấp"); } });
    return () => { live = false; };
  }, [supplierId, read, revision, initialSupplier]);
  function setChangeStatus(open: boolean) {
    setChangeStatusOpen(open);
    if (!open) { setReasonCode(""); setReason(""); setStatusError(""); }
  }
  const operation: "SUSPEND" | "ACTIVATE" = supplier?.status === "ACTIVE" ? "SUSPEND" : "ACTIVATE";
  const reasonReady = supplier !== undefined && (operation === "ACTIVATE" || reasonCode !== "") && (!supplierReasonNoteRequired(operation, reasonCode) || reason.trim() !== "");
  async function change() {
    if (!supplier || !reasonReady || busy || !can("inventory:supplier:update")) return;
    setBusy(true); setStatusError("");
    try { setSupplier(await suspendSupplier(supplierId, operation, { code: reasonCode, note: reason })); setChangeStatus(false); toast.success(operation === "SUSPEND" ? `Đã ngừng hợp tác với ${supplier.name}` : `Đã hợp tác lại với ${supplier.name}`); }
    catch { setStatusError("Không đổi được trạng thái hợp tác. Hãy thử lại."); }
    finally { setBusy(false); }
  }
  return { supplierId, can, read, supplier, error, notFound, changeStatus, setChangeStatus, operation, reasonCode, setReasonCode, reasonReady, statusError, reason, setReason, busy, setRevision, setSupplier, change,
    photoUrl: photo.identity === photoIdentity ? photo.url : "", photoFailed: () => setPhoto({ identity: photoIdentity, url: "" }),
  };
}
