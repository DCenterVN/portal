import { PageShell } from "@/components/ui/page";
import { PageHeading } from "@/components/patterns/page-heading";
import { SupplierOverviewContainer } from "@/features/inventory/supplier-overview-container";
import { SupplierSectionTabs } from "@/features/inventory/supplier-section-tabs";
import { inventoryServerGet } from "@/lib/api/inventory-server";
import { supplierOverviewSchema } from "@/lib/api/supplier-overview";

export default async function SupplierOverviewPage() {
  const initial = await inventoryServerGet("/inventory/suppliers/overview", supplierOverviewSchema);
  return <PageShell>
    <PageHeading title="Nhà cung cấp" description="Số liệu nhanh, mỗi số dẫn tới danh sách cần xem." />
    <SupplierSectionTabs />
    <SupplierOverviewContainer initial={initial} />
  </PageShell>;
}
