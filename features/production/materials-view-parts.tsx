"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Pagination, PaginationContent, PaginationItem, PaginationLink } from "@/components/ui/pagination";
import { cn } from "@/lib/utils";
import type { MaterialCategory, Material } from "@/lib/api/material-catalog";
import { UNCATEGORIZED, pageNumbers } from "./materials-catalog";

export function MaterialCard({ material, onOpen }: { material: Material; onOpen?: (material: Material) => void }) {
  const [failed, setFailed] = useState(false);
  const body = <>
    <div className="relative aspect-square w-full overflow-hidden rounded-lg bg-muted">
      {material.imageUrl && !failed
        ? <img src={material.imageUrl} alt={material.name} loading="lazy" onError={() => setFailed(true)} className="size-full object-cover" />
        : <div data-testid="material-fallback" aria-hidden="true" className="flex size-full items-center justify-center bg-muted text-2xl font-medium text-muted-foreground">{material.name.trim().charAt(0).toUpperCase()}</div>}
      {material.status === "DRAFT" && <Badge variant="secondary" className="absolute top-2 left-2">Nháp</Badge>}
    </div>
    <p className="line-clamp-2 text-left text-sm font-medium">{material.name}</p>
  </>;
  return <li>{onOpen
    ? <Button type="button" variant="ghost" onClick={() => onOpen(material)} className="h-auto w-full flex-col items-stretch gap-2 p-0 font-normal whitespace-normal">{body}</Button>
    : <div className="flex flex-col gap-2">{body}</div>}</li>;
}

export function MaterialGrid({ items, onOpen }: { items: Material[]; onOpen?: (material: Material) => void }) {
  if (items.length === 0) return <Empty><EmptyHeader><EmptyTitle>Chưa có nguyên liệu nào trong loại này</EmptyTitle><EmptyDescription>Thử đổi loại, đổi trạng thái hoặc xoá từ khoá tìm kiếm.</EmptyDescription></EmptyHeader></Empty>;
  return <ul className="grid animate-in fade-in grid-cols-2 gap-4 duration-200 motion-reduce:animate-none sm:grid-cols-4 lg:grid-cols-6">{items.map(material => <MaterialCard key={material.id} material={material} onOpen={onOpen} />)}</ul>;
}

const STEP_PX = 240;
const reduced = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function useWheelScroll(strip: React.RefObject<HTMLDivElement | null>) {
  useEffect(() => {
    const node = strip.current;
    if (!node) return;
    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      node.scrollBy({ left: event.deltaY || event.deltaX });
    };
    node.addEventListener("wheel", onWheel, { passive: false });
    return () => node.removeEventListener("wheel", onWheel);
  }, [strip]);
}

function useSlidingBox(list: React.RefObject<HTMLDivElement | null>, current: string) {
  const [box, setBox] = useState<{ x: number; w: number } | null>(null);
  useLayoutEffect(() => {
    const measure = () => {
      const active = list.current?.querySelector<HTMLElement>('[data-state="active"]');
      if (active) setBox({ x: active.offsetLeft, w: active.offsetWidth });
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [list, current]);
  return box;
}

function useScrollEdges(strip: React.RefObject<HTMLDivElement | null>) {
  const [edges, setEdges] = useState({ left: false, right: true });
  useLayoutEffect(() => {
    const node = strip.current;
    if (!node) return;
    const measure = () => setEdges({ left: node.scrollLeft > 1, right: node.scrollLeft + node.clientWidth < node.scrollWidth - 1 });
    measure();
    node.addEventListener("scroll", measure, { passive: true });
    window.addEventListener("resize", measure);
    return () => { node.removeEventListener("scroll", measure); window.removeEventListener("resize", measure); };
  }, [strip]);
  return edges;
}

function EdgeButton({ side, label, onClick }: { side: "left" | "right"; label: string; onClick: () => void }) {
  const Icon = side === "left" ? ChevronLeft : ChevronRight;
  return <div className={cn("pointer-events-none absolute inset-y-0 z-20 flex items-center from-muted from-60% to-transparent", side === "left" ? "left-0 rounded-l-full bg-gradient-to-r pr-5 pl-1" : "right-0 rounded-r-full bg-gradient-to-l pr-1 pl-5")}>
    <Button variant="outline" size="icon-sm" className="pointer-events-auto" aria-label={label} onClick={onClick}><Icon aria-hidden="true" /></Button>
  </div>;
}

type BarProps = { current: string; category: MaterialCategory[]; counts: Record<string, number>; onSelect: (code: string) => void; onManage?: () => void };

export function CategoryBar({ current, category, counts, onSelect, onManage }: BarProps) {
  const strip = useRef<HTMLDivElement>(null);
  const list = useRef<HTMLDivElement>(null);
  const box = useSlidingBox(list, current);
  const edges = useScrollEdges(strip);
  useWheelScroll(strip);
  useEffect(() => {
    list.current?.querySelector('[data-state="active"]')?.scrollIntoView({ inline: "center", block: "nearest", behavior: reduced() ? "auto" : "smooth" });
  }, [current]);
  const step = (direction: number) => strip.current?.scrollBy({ left: direction * STEP_PX, behavior: reduced() ? "auto" : "smooth" });
  return <div className="flex min-w-0 flex-1 items-center gap-2"><div className="relative min-w-0 flex-1" role="group" aria-label="Loại sản phẩm">
    <div ref={strip} className="overflow-x-auto rounded-full [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <Tabs value={current} onValueChange={onSelect}>
        <TabsList ref={list} className="relative w-max justify-start gap-1 rounded-full group-data-[orientation=horizontal]/tabs:h-10">
          <span aria-hidden="true" className="absolute top-[3px] bottom-[3px] left-0 rounded-full bg-background shadow-sm transition-[transform,width] duration-300 ease-out motion-reduce:transition-none dark:bg-input/30" style={box ? { transform: `translateX(${box.x}px)`, width: box.w } : { opacity: 0 }} />
          {category.filter(item => item.active).map(item => <TabsTrigger key={item.code} value={item.code} className="z-10 h-full flex-none rounded-full px-3.5 data-[state=active]:border-transparent data-[state=active]:bg-transparent data-[state=active]:shadow-none dark:data-[state=active]:border-transparent dark:data-[state=active]:bg-transparent">
            {item.label} <span className="opacity-70">{counts[item.code] ?? 0}</span>
          </TabsTrigger>)}
          {(counts[UNCATEGORIZED] ?? 0) > 0 && <TabsTrigger value={UNCATEGORIZED} className="z-10 h-full flex-none rounded-full px-3.5 data-[state=active]:border-transparent data-[state=active]:bg-transparent data-[state=active]:shadow-none dark:data-[state=active]:border-transparent dark:data-[state=active]:bg-transparent">
            Chưa xếp loại <span className="opacity-70">{counts[UNCATEGORIZED]}</span>
          </TabsTrigger>}
        </TabsList>
      </Tabs>
    </div>
    {edges.left && <EdgeButton side="left" label="Cuộn loại sang trái" onClick={() => step(-1)} />}
    {edges.right && <EdgeButton side="right" label="Cuộn loại sang phải" onClick={() => step(1)} />}
  </div>
    {onManage && <Button variant="outline" size="md" className="shrink-0" onClick={onManage}>Quản lý loại</Button>}
  </div>;
}

function PageLink({ page, label, disabled, active, onGo, children }: { page: number; label: string; disabled?: boolean; active?: boolean; onGo: (page: number) => void; children: React.ReactNode }) {
  return <PaginationItem>
    <PaginationLink href="#" size={typeof children === "number" ? "icon" : "default"} isActive={active} aria-label={label} aria-disabled={disabled || undefined}
      className={cn(disabled && "pointer-events-none opacity-50")} onClick={event => { event.preventDefault(); if (!disabled) onGo(page); }}>{children}</PaginationLink>
  </PaginationItem>;
}

export function NumberedPager({ current, total, onGo }: { current: number; total: number; onGo: (page: number) => void }) {
  if (total <= 1) return null;
  return <Pagination aria-label="Phân trang danh mục" className="pt-6">
    <PaginationContent>
      <PageLink page={current - 1} label="Trang trước" disabled={current <= 1} onGo={onGo}><ChevronLeft aria-hidden="true" /></PageLink>
      {pageNumbers(current, total).map((item, index) => item === "gap"
        ? <PaginationItem key={`gap-${index}`} className="px-1 text-muted-foreground">…</PaginationItem>
        : <PageLink key={item} page={item} label={`Trang ${item}`} active={item === current} onGo={onGo}>{item}</PageLink>)}
      <PageLink page={current + 1} label="Trang sau" disabled={current >= total} onGo={onGo}><ChevronRight aria-hidden="true" /></PageLink>
    </PaginationContent>
  </Pagination>;
}
