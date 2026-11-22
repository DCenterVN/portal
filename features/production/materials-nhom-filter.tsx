"use client";

import { useState } from "react";
import { Check, PlusCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import type { Nhom } from "@/lib/api/material-catalog";

type Props = { nhom: Nhom[]; selected: string[]; counts: Record<string, number>; onChange: (next: string[]) => void };

export function NhomOption({ label, count, checked }: { label: string; count: number; checked: boolean }) {
  return <>
    <span aria-hidden="true" className={cn("flex size-4 shrink-0 items-center justify-center rounded-sm border border-primary", checked ? "bg-primary text-primary-foreground" : "opacity-50")}>
      {checked && <Check className="size-3.5 text-primary-foreground" />}
    </span>
    <span className="flex-1">{label}</span>
    <span className="text-xs text-muted-foreground tabular-nums">{count}</span>
  </>;
}

function Chosen({ nhom, selected }: { nhom: Nhom[]; selected: string[] }) {
  if (!selected.length) return null;
  const labels = nhom.filter(item => selected.includes(item.code)).map(item => item.label);
  return <>
    <Separator orientation="vertical" className="mx-1 h-4" />
    {selected.length > 2
      ? <Badge variant="secondary" className="rounded-sm px-1 font-normal">{selected.length} nhóm</Badge>
      : labels.map(label => <Badge key={label} variant="secondary" className="rounded-sm px-1 font-normal">{label}</Badge>)}
  </>;
}

export function NhomFilter({ nhom, selected, counts, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const toggle = (code: string) => onChange(selected.includes(code) ? selected.filter(item => item !== code) : [...selected, code]);
  return <Popover open={open} onOpenChange={setOpen}>
    <PopoverTrigger asChild>
      <Button variant="outline" size="md" className="border-dashed"><PlusCircle aria-hidden="true" />Nhóm<Chosen nhom={nhom} selected={selected} /></Button>
    </PopoverTrigger>
    <PopoverContent align="start" className="w-56 p-0">
      <Command>
        <CommandInput placeholder="Tìm nhóm…" />
        <CommandList>
          <CommandEmpty>Không có nhóm nào.</CommandEmpty>
          <CommandGroup>
            {nhom.map(item => <CommandItem key={item.code} value={item.label} onSelect={() => toggle(item.code)}>
              <NhomOption label={item.label} count={counts[item.code] ?? 0} checked={selected.includes(item.code)} />
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
