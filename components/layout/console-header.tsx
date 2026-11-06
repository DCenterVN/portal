"use client";

import { Fragment, type ReactNode } from "react";
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import type { Crumb } from "@/lib/navigation";
import { ThemeToggle } from "./theme-toggle";

type Props = {
  crumbs: Crumb[];
  actions?: ReactNode;
};

export function ConsoleHeader({ crumbs, actions }: Props) {
  return (
    <header className="sticky top-0 z-(--z-header) flex h-14 shrink-0 items-center gap-2 border-b border-border bg-background px-4">
      <SidebarTrigger className="-ml-1 max-md:size-11" />
      <Separator orientation="vertical" className="mr-1 data-[orientation=vertical]:h-4" />
      {crumbs.length > 0 && (
        <Breadcrumb className="min-w-0">
          <BreadcrumbList>
            {crumbs.map((crumb, index) => (
              <Fragment key={crumb.label}>
                {index > 0 && <BreadcrumbSeparator className="hidden md:block" />}
                <BreadcrumbItem className={index === crumbs.length - 1 ? "min-w-0" : "hidden md:block"}>
                  {index === crumbs.length - 1 ? <BreadcrumbPage className="truncate">{crumb.label}</BreadcrumbPage> : crumb.label}
                </BreadcrumbItem>
              </Fragment>
            ))}
          </BreadcrumbList>
        </Breadcrumb>
      )}
      <div className="ml-auto flex shrink-0 items-center gap-2">
        {actions}
        <ThemeToggle />
      </div>
    </header>
  );
}
