"use client";

import type { ComponentProps, ElementType } from "react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

type Props = Omit<ComponentProps<typeof Button>, "children" | "size" | "variant"> & { icon: ElementType; label: string };

export function IconAction({ icon: Icon, label, className, ...props }: Props) {
  return <TooltipProvider><Tooltip>
    <TooltipTrigger asChild>
      <Button type="button" variant="ghost" size="icon" aria-label={label} className={cn("size-8 text-muted-foreground hover:text-foreground", className)} {...props}><Icon className="size-4" aria-hidden="true" /></Button>
    </TooltipTrigger>
    <TooltipContent>{label}</TooltipContent>
  </Tooltip></TooltipProvider>;
}

export const IconSlot = () => <span aria-hidden="true" className="size-8 shrink-0" />;
