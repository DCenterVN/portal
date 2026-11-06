import * as React from "react";
import { cn } from "@/lib/utils";

export function PageShell({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    // Horizontal padding belongs to the shell's main element; only the store shell has no vertical padding.
    <div className={cn("mx-auto w-full max-w-7xl in-data-[surface=store]:py-8", className)}>
      {children}
    </div>
  );
}
