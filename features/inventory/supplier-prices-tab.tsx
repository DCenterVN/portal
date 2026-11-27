"use client";

import type { Supplier } from "@/lib/api/suppliers";
import { SupplierAgreementsContainer } from "./supplier-agreements-container";
import { SupplierMaterialsView } from "./supplier-materials-view";
import { useSupplierPriceRows } from "./use-supplier-price-rows";

type SupplierPricesTabProps = { supplier: Supplier; canUpdate: boolean; read: boolean; startNew?: boolean; onNewClosed?: () => void };
export function SupplierPricesTab({ supplier, canUpdate, read, startNew = false, onNewClosed }: SupplierPricesTabProps) {
  const { rows, drafts, state, reload } = useSupplierPriceRows(supplier.id, read);
  return <>
    <SupplierMaterialsView profile state={state} rows={rows} drafts={drafts} active={supplier.status === "ACTIVE"} canUpdate={canUpdate} supplierId={supplier.id} onAdd={() => {}} onEdit={() => {}} onStatus={() => {}} onRetry={reload} />
    <SupplierAgreementsContainer supplierId={supplier.id} supplierCode={supplier.code} startNew={startNew} suspended={supplier.status !== "ACTIVE"} onNewClosed={onNewClosed} />
  </>;
}
