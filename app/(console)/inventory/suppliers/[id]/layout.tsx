import type { ReactNode } from "react";
import { SupplierDetailContainer } from "@/features/inventory/supplier-detail-container";

export default async function SupplierLayout({ params, children }: { params: Promise<{ id: string }>; children: ReactNode }) {
  const { id } = await params;
  return <SupplierDetailContainer supplierId={id}>{children}</SupplierDetailContainer>;
}
