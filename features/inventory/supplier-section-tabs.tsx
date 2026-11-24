"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { supplierHref } from "./supplier-routes";

const tabs = [{ href: supplierHref.list, label: "Danh sách" }, { href: supplierHref.overview, label: "Tổng quan" }];

export function SupplierSectionTabs() {
  const pathname = (usePathname() ?? "").replace(/\/$/, "");
  return <nav aria-label="Mục nhà cung cấp" className="mb-4 flex gap-1 border-b">
    {tabs.map(tab => {
      const active = pathname === tab.href;
      return <Link key={tab.href} href={tab.href} aria-current={active ? "page" : undefined} className={cn("-mb-px border-b-2 px-3 py-2 text-sm font-medium", active ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground")}>{tab.label}</Link>;
    })}
  </nav>;
}
