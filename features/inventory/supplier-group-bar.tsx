"use client";

import { useEffect, useRef, useState, type RefObject } from "react";
import { Check, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { MaterialCategory } from "@/lib/api/inventory/types";
import { materialCategoryRank } from "@/lib/material-category-order";
import { cn } from "@/lib/utils";

type GroupBarProps = { categories: MaterialCategory[]; selected: string; onSelect: (code: string) => void };

function useScrollEdges(strip: RefObject<HTMLDivElement | null>, key: number) {
  const [edges, setEdges] = useState({ left: false, right: false });
  useEffect(() => {
    const node = strip.current;
    if (!node) return;
    const measure = () => setEdges({
      left: node.scrollLeft > 1,
      right: node.scrollLeft + node.clientWidth < node.scrollWidth - 1,
    });
    measure();
    node.addEventListener("scroll", measure, { passive: true });
    window.addEventListener("resize", measure);
    const observer = typeof ResizeObserver !== "undefined" ? new ResizeObserver(measure) : null;
    observer?.observe(node);
    return () => {
      node.removeEventListener("scroll", measure);
      window.removeEventListener("resize", measure);
      observer?.disconnect();
    };
  }, [strip, key]);
  return edges;
}

export function SupplierGroupBar({ categories, selected, onSelect }: GroupBarProps) {
  const strip = useRef<HTMLDivElement>(null);
  const sorted = [...categories].sort((a, b) => materialCategoryRank(a.code) - materialCategoryRank(b.code));
  const edges = useScrollEdges(strip, sorted.length);
  if (!sorted.length) return null;

  const step = (direction: number) => {
    const reduced = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    strip.current?.scrollBy({ left: direction * 240, behavior: reduced ? "auto" : "smooth" });
  };

  return (
    <div className="relative min-w-0" role="group" aria-label="Nhóm nguyên liệu">
      <div ref={strip} className="overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div className="flex w-max items-center gap-1.5">
          <Button type="button" size="sm" variant={selected ? "outline" : "secondary"} aria-pressed={!selected} onClick={() => onSelect("")}>
            Tất cả
          </Button>
          {sorted.map(parent => {
            const child = parent.children.find(item => item.code === selected);
            return (
              <Popover key={parent.code}>
                <PopoverTrigger asChild>
                  <Button type="button" size="sm" variant={child ? "secondary" : "outline"} aria-pressed={Boolean(child)}>
                    {child ? `${parent.name}: ${child.name}` : parent.name}
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="start" className="w-56 p-1">
                  <p className="px-2 py-1.5 text-xs font-medium text-muted-foreground">{parent.name}</p>
                  {parent.children.map(item => (
                    <Button
                      key={item.code}
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => onSelect(item.code === selected ? "" : item.code)}
                      className={cn("w-full justify-start gap-2", item.code === selected && "font-medium")}
                    >
                      <Check aria-hidden="true" className={cn("size-4", item.code !== selected && "opacity-0")} />
                      {item.name}
                    </Button>
                  ))}
                </PopoverContent>
              </Popover>
            );
          })}
        </div>
      </div>
      {edges.left && (
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 flex items-center bg-background/90 pr-1">
          <Button type="button" variant="outline" size="icon-sm" className="pointer-events-auto" aria-label="Cuộn nhóm sang trái" onClick={() => step(-1)}>
            <ChevronLeft aria-hidden="true" />
          </Button>
        </div>
      )}
      {edges.right && (
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 flex items-center bg-background/90 pl-1">
          <Button type="button" variant="outline" size="icon-sm" className="pointer-events-auto" aria-label="Cuộn nhóm sang phải" onClick={() => step(1)}>
            <ChevronRight aria-hidden="true" />
          </Button>
        </div>
      )}
    </div>
  );
}
