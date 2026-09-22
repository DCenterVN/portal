import type { Metadata } from "next";
import { Suspense } from "react";
import { DashboardView } from "@/features/operations/components/dashboard-view";
import { Skeleton } from "@dcentervn/ui";

export const metadata: Metadata = {
  title: "Bảng điều hành chuỗi cung ứng — Việt Sạch",
  description: "Trung tâm quản trị vận hành kho lạnh, kiểm định QC và logistics phân phối Việt Sạch",
};

export default function DashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-6">
          <Skeleton className="h-8 w-64" />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Skeleton className="h-28 rounded-xl" />
            <Skeleton className="h-28 rounded-xl" />
            <Skeleton className="h-28 rounded-xl" />
            <Skeleton className="h-28 rounded-xl" />
          </div>
        </div>
      }
    >
      <DashboardView />
    </Suspense>
  );
}
