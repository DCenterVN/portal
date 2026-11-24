"use client";

import { useSupplierOverview } from "./use-supplier-overview";
import { SupplierOverviewView } from "./supplier-overview-view";
import type { SupplierOverview } from "@/lib/api/supplier-overview";

export function SupplierOverviewContainer({ initial }: { initial?: SupplierOverview }) {
  return <SupplierOverviewView {...useSupplierOverview(initial)} />;
}
