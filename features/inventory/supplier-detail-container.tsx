"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { useSupplierDetail, type SupplierDetailOptions } from "./use-supplier-detail";
import { SupplierDetailView } from "./supplier-detail-view";
import { supplierSection } from "./supplier-routes";

type SupplierDetailContainerProps = SupplierDetailOptions & { tab?: ReturnType<typeof supplierSection>["tab"]; children?: ReactNode };
function SupplierDetailSession({ tab, children, ...options }: SupplierDetailContainerProps) {
  const section = supplierSection(usePathname(), options.supplierId);
  return <SupplierDetailView {...useSupplierDetail(options)} tab={tab ?? section.tab} label={section.label}>{children}</SupplierDetailView>;
}

export function SupplierDetailContainer(props: SupplierDetailContainerProps) {
  return <SupplierDetailSession key={props.supplierId} {...props} />;
}
