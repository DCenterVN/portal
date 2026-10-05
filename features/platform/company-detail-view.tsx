"use client";

import Link from "next/link";
import type { Route } from "next";
import { usePathname } from "next/navigation";
import { ArrowLeft, Building2 } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page";
import { cn } from "@/lib/utils";
import { RequireAction, useAccess } from "./access-boundary";
import { CompanyModules } from "./company-modules";

export function CompanyTabs({ root }: { root: string }) {
  const pathname = usePathname();
  const { can } = useAccess();
  const base = `/platform/companies/${root}`;
  const tabs = [
    { href: base, label: "Module", show: can("platform:org:read") },
    { href: `${base}/role-matrix`, label: "Ma trận quyền", show: can("platform:role_matrix:read") },
  ].filter((tab) => tab.show);
  return (
    <nav aria-label="Mục của công ty" className="flex gap-1 border-b border-[var(--border)]">
      {tabs.map((tab) => (
        <Link
          key={tab.href}
          href={tab.href as Route}
          aria-current={pathname === tab.href ? "page" : undefined}
          className={cn(
            "flex min-h-11 items-center border-b-2 px-3 text-sm font-medium",
            pathname === tab.href ? "border-[var(--primary)] text-[var(--primary)]" : "border-transparent text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
          )}
        >
          {tab.label}
        </Link>
      ))}
    </nav>
  );
}

export function CompanyHeader({ root, title }: { root: string; title: string }) {
  return (
    <PageHeader
      icon={<Building2 />}
      title={title}
      description={`MAIN ${root}`}
      actions={
        <Link href={"/platform/companies" as Route} className={buttonVariants({ variant: "outline", size: "touch" })}>
          <ArrowLeft aria-hidden="true" /> Danh sách
        </Link>
      }
    />
  );
}

export function CompanyDetailView({ root }: { root: string }) {
  const { can } = useAccess();
  return (
    <RequireAction action="platform:org:read">
      <CompanyHeader root={root} title="Module của công ty" />
      <CompanyTabs root={root} />
      <CompanyModules source="platform" root={root} editable={can("platform:module:manage")} />
    </RequireAction>
  );
}
