"use client";

import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { MaterialCategory } from "@/lib/api/inventory/types";
import { cn } from "@/lib/utils";

type GroupBarProps = { categories: MaterialCategory[]; selected: string; onSelect: (code: string) => void };

export function SupplierGroupBar({ categories, selected, onSelect }: GroupBarProps) {
  if (!categories.length) return null;
  return <div role="group" aria-label="Nhóm nguyên liệu" className="flex flex-wrap gap-2">
    <Button type="button" size="sm" variant={selected ? "outline" : "secondary"} aria-pressed={!selected} onClick={() => onSelect("")}>Tất cả</Button>
    {categories.map(parent => {
      const child = parent.children.find(item => item.code === selected);
      return <Popover key={parent.code}>
        <PopoverTrigger asChild>
          <Button type="button" size="sm" variant={child ? "secondary" : "outline"} aria-pressed={Boolean(child)}>{child ? `${parent.name}: ${child.name}` : parent.name}</Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-56 p-1">
          <p className="px-2 py-1.5 text-xs font-medium text-muted-foreground">{parent.name}</p>
          {parent.children.map(item => <Button key={item.code} type="button" variant="ghost" size="sm" onClick={() => onSelect(item.code === selected ? "" : item.code)} className={cn("w-full justify-start gap-2", item.code === selected && "font-medium")}>
            <Check aria-hidden="true" className={cn("size-4", item.code !== selected && "opacity-0")} />{item.name}
          </Button>)}
        </PopoverContent>
      </Popover>;
    })}
  </div>;
}
