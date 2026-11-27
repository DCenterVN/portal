import { redirect } from "next/navigation";
import { supplierHref } from "@/features/inventory/supplier-routes";

export const metadata = { title: "Tổng quan nhà cung cấp" };

export default function SupplierOverviewPage() {
  redirect(supplierHref.list);
}
