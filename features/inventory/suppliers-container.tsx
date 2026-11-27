"use client";

import { useSuppliers, type SuppliersInitial } from "./use-suppliers";
import { SuppliersView } from "./suppliers-view";

export function SuppliersContainer({ initial }: { initial?: SuppliersInitial }) {
  return <SuppliersView {...useSuppliers(initial)} />;
}
