"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { Supplier } from "@/lib/api/suppliers";
import { SupplierStatusDialog } from "./supplier-detail-view";
import { SupplierMaterialsView } from "./supplier-materials-view";
import { useSupplierDetail } from "./use-supplier-detail";
import { useSupplierPriceRows } from "./use-supplier-price-rows";
import { supplierHref } from "./supplier-routes";

type SupplierMaterialsPanelProps = { supplier: Supplier; onChanged: () => void };
export function SupplierMaterialsPanel({ supplier, onChanged }: SupplierMaterialsPanelProps) {
  const [initial] = useState(supplier);
  const detail = useSupplierDetail({ supplierId: initial.id, initialSupplier: initial });
  const { supplier: loaded, can, read, supplierId, ...status } = detail;
  const router = useRouter();
  const current = loaded ?? initial;
  const { rows, drafts, state, reload } = useSupplierPriceRows(supplierId, read);
  useEffect(() => { if (current.status !== supplier.status) onChanged(); }, [current.status, supplier.status, onChanged]);
  return <>
    <SupplierMaterialsView state={state} rows={rows} drafts={drafts} active={current.status === "ACTIVE"} canUpdate={can("inventory:supplier:update")} supplierId={supplierId}
      onAdd={() => router.push(supplierHref.newPrice(supplierId))} onEdit={() => router.push(supplierHref.edit(supplierId))} onStatus={() => status.setChangeStatus(true)} onRetry={reload} />
    <SupplierStatusDialog supplier={current} {...status} />
  </>;
}
