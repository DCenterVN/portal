"use client";

import { useSupplierDetail, type SupplierDetailOptions } from "./use-supplier-detail";
import { SupplierDetailView } from "./supplier-detail-view";

function SupplierDetailSession(props: SupplierDetailOptions) {
  return <SupplierDetailView {...useSupplierDetail(props)} />;
}

export function SupplierDetailContainer(props: SupplierDetailOptions) {
  return <SupplierDetailSession key={props.supplierId} {...props} />;
}
