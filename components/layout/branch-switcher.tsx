"use client";

import { useState } from "react";
import { Check, ChevronsUpDown, Store } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { BranchList } from "@/components/patterns/branch-list";
import { BRANCH_SEARCH_FROM } from "@/lib/branch-choices";
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar } from "@/components/ui/sidebar";
import { branchLabel, type BranchChoice } from "@/lib/branch-label";
import { cn } from "@/lib/utils";

export type BranchSwitch = { branch: BranchChoice; branches: BranchChoice[]; busy: boolean; onSelect: (branchId: string) => void };

function Summary({ branch }: { branch: BranchChoice }) {
  return (
    <>
      <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
        <Store className="size-4" aria-hidden="true" />
      </div>
      <div className="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
        <span className="truncate font-semibold">{branchLabel(branch)}</span>
        {(branch.code || branch.status === "SUSPENDED") && (
          <span className="truncate text-xs text-muted-foreground">{[branch.code, branch.status === "SUSPENDED" && "Tạm ngừng"].filter(Boolean).join(" · ")}</span>
        )}
      </div>
    </>
  );
}

export function BranchSwitcher({ branch, branches, busy, onSelect }: BranchSwitch) {
  const { isMobile } = useSidebar();
  const [open, setOpen] = useState(false);
  const label = branchLabel(branch);
  if (branches.length < 2) {
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton size="lg" asChild tooltip={label} className="cursor-default hover:bg-transparent active:bg-transparent">
            <div aria-label={`Chi nhánh đang làm việc: ${label}`}><Summary branch={branch} /></div>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    );
  }
  const trigger = (
    <SidebarMenuButton size="lg" tooltip={label} aria-label={`Chi nhánh đang làm việc: ${label}. Đổi chi nhánh`} className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground">
      <Summary branch={branch} />
      <ChevronsUpDown className="ml-auto size-4 group-data-[collapsible=icon]:hidden" aria-hidden="true" />
    </SidebarMenuButton>
  );
  const side = isMobile ? "bottom" : "right";
  if (branches.length >= BRANCH_SEARCH_FROM) {
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild disabled={busy}>{trigger}</PopoverTrigger>
            <PopoverContent className="w-80 p-0" side={side} align="start" sideOffset={4}>
              <BranchList branches={branches} currentId={branch.id} onPick={(id) => { setOpen(false); if (id !== branch.id) onSelect(id); }} />
            </PopoverContent>
          </Popover>
        </SidebarMenuItem>
      </SidebarMenu>
    );
  }
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild disabled={busy}>{trigger}</DropdownMenuTrigger>
          <DropdownMenuContent className="w-(--radix-dropdown-menu-trigger-width) min-w-72" side={side} align="start" sideOffset={4}>
            <DropdownMenuLabel className="text-xs text-muted-foreground">Chi nhánh</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {branches.map((item) => (
              <DropdownMenuItem key={item.id} onSelect={() => item.id !== branch.id && onSelect(item.id)} aria-current={item.id === branch.id ? "true" : undefined}>
                <Check className={cn("size-4", item.id !== branch.id && "invisible")} aria-hidden="true" />
                <span className="flex-1 truncate">{branchLabel(item)}</span>
                {item.status === "SUSPENDED" && <Badge variant="outline">Tạm ngừng</Badge>}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
