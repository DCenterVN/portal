"use client";

import { useState } from "react";
import { Check, ListFilter, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { MaterialGroup } from "@/lib/api/material-catalog";

type Props = { groups: MaterialGroup[]; selected: string[]; counts: Record<string, number>; onChange: (next: string[]) => void };

export function GroupOption({ label, count, checked }: { label: string; count: number; checked: boolean }) {
  return <>
    <span aria-hidden="true" className={cn("flex size-4 shrink-0 items-center justify-center rounded-sm border border-primary", checked ? "bg-primary text-primary-foreground" : "opacity-50")}>
      {checked && <Check className="size-3.5 text-primary-foreground" />}
    </span>
    <span className="flex-1">{label}</span>
    <span className="text-xs text-muted-foreground tabular-nums">{count}</span>
  </>;
}

export function GroupChips({ groups, selected, onChange }: { groups: MaterialGroup[]; selected: string[]; onChange: (next: string[]) => void }) {
  const chosen = groups.filter(item => selected.includes(item.code));
  if (!chosen.length) return null;
  return <ul className="mb-4 flex flex-wrap items-center gap-2" aria-label="Nhóm đang lọc">
    {chosen.map(item => <li key={item.code}><Badge variant="secondary" className="gap-1 pr-0.5 font-normal">{item.label}
      <Button type="button" variant="ghost" size="icon-xs" aria-label={`Bỏ lọc ${item.label}`} onClick={() => onChange(selected.filter(code => code !== item.code))}><X aria-hidden="true" /></Button>
    </Badge></li>)}
  </ul>;
}

export function MaterialGroupFilter({ groups, selected, counts, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const toggle = (code: string) => onChange(selected.includes(code) ? selected.filter(item => item !== code) : [...selected, code]);
  return <Popover open={open} onOpenChange={setOpen}>
    <TooltipProvider><Tooltip>
      <TooltipTrigger asChild><PopoverTrigger asChild>
        <Button data-testid="toolbar-filter" type="button" variant="outline" size="icon" aria-label="Lọc theo nhóm" className="relative"><ListFilter aria-hidden="true" />
          {selected.length > 0 && <span data-testid="group-count" className="absolute -top-1.5 -right-1.5 flex size-4 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground tabular-nums">{selected.length}</span>}
        </Button>
      </PopoverTrigger></TooltipTrigger>
      <TooltipContent>Lọc theo nhóm</TooltipContent>
    </Tooltip></TooltipProvider>
    <PopoverContent align="start" className="w-56 p-0">
      <Command>
        <CommandInput placeholder="Tìm nhóm…" />
        <CommandList>
          <CommandEmpty>Không có nhóm nào.</CommandEmpty>
          <CommandGroup>
            {groups.map(item => <CommandItem key={item.code} value={item.label} onSelect={() => toggle(item.code)}>
              <GroupOption label={item.label} count={counts[item.code] ?? 0} checked={selected.includes(item.code)} />
            </CommandItem>)}
          </CommandGroup>
          {selected.length > 0 && <>
            <CommandSeparator />
            <CommandGroup><CommandItem onSelect={() => onChange([])} className="justify-center">Bỏ lọc</CommandItem></CommandGroup>
          </>}
        </CommandList>
      </Command>
    </PopoverContent>
  </Popover>;
}
