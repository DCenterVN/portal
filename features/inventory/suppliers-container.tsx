"use client";

import { useSuppliers } from "./use-suppliers";
import { SuppliersView } from "./suppliers-view";

type SuppliersContainerProps = { initialPage?: Parameters<typeof useSuppliers>[0] };
export function SuppliersContainer({ initialPage }: SuppliersContainerProps) {
  return <SuppliersView {...useSuppliers(initialPage)} />;
}
