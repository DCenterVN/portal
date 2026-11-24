"use client";

import { useMemo, useState } from "react";
import { ChevronDown } from "lucide-react";
import { LoadingState } from "@/components/patterns/empty-state";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import type { Material } from "@/lib/api/material-catalog";
import { cn } from "@/lib/utils";
import { countByCategory, countByGroup, filterMaterials, fold, groupsOf, matchesName, UNCATEGORIZED } from "../materials-catalog";
import { GroupChips } from "../material-group-filter";
import { MaterialToolbar } from "../material-toolbar";
import { CategoryBar, MaterialGrid, NumberedPager } from "../materials-view-parts";
import type { Catalog } from "./use-dish-data";

const COLUMNS = "grid-cols-3 gap-3 xl:grid-cols-4";
const PICKER_PAGE_SIZE = 12;

export function DishMaterialPicker({ catalog, selectedIds, readOnly = false, pickDisabled = false, onPick }: { catalog: Catalog | null; selectedIds: ReadonlySet<string>; readOnly?: boolean; pickDisabled?: boolean; onPick: (material: Material) => void }) {
  const [open, setOpen] = useState(!readOnly);
  const [text, setText] = useState("");
  const [asked, setAsked] = useState("");
  const [groups, setGroups] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const items = useMemo(() => catalog?.items ?? [], [catalog]);
  const tree = useMemo(() => catalog?.tree ?? [], [catalog]);
  const counts = useMemo(() => countByCategory(items.filter(item => matchesName(item.name, text))), [items, text]);
  const term = fold(text.trim());
  const bestCategory = useMemo(() => {
    if (!term) return "";
    const starts = (code: string) => items.some(item => (item.category || UNCATEGORIZED) === code && fold(item.name).startsWith(term));
    const active = tree.filter(item => item.active && counts[item.code]);
    return active.find(item => starts(item.code))?.code ?? [...active].sort((a, b) => (counts[b.code] ?? 0) - (counts[a.code] ?? 0))[0]?.code ?? "";
  }, [items, tree, counts, term]);
  const category = (asked && counts[asked] ? asked : bestCategory || tree.find(item => item.active && counts[item.code])?.code) ?? asked;
  const matches = useMemo(() => filterMaterials(items, category, text, groups), [items, category, text, groups]);
  const groupOptions = groupsOf(tree, category);
  const choose = (next: string) => { setAsked(next); setGroups([]); setPage(1); };
  const totalPages = Math.max(1, Math.ceil(matches.length / PICKER_PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageItems = matches.slice((currentPage - 1) * PICKER_PAGE_SIZE, currentPage * PICKER_PAGE_SIZE);
  return <section aria-label="Danh mục nguyên liệu" className="min-w-0">
    <Collapsible open={open} onOpenChange={setOpen} className="overflow-hidden rounded-xl border bg-card shadow-sm">
      <div className={cn("flex items-center justify-between gap-2 bg-muted/40 px-4 py-3", open && "border-b")}>
        <CollapsibleTrigger className="flex flex-1 items-center justify-between gap-2 rounded-lg text-left outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50">
          <span className="flex items-center gap-2">
            <span className="text-sm font-semibold">Chọn nguyên liệu</span>
            <Badge variant={selectedIds.size > 0 ? "secondary" : "outline"} className="font-normal">{selectedIds.size > 0 ? `Đã chọn ${selectedIds.size}` : `${items.length} nguyên liệu`}</Badge>
          </span>
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span>{open ? "Thu gọn" : "Mở rộng"}</span>
            <ChevronDown className={cn("size-4 transition-transform duration-200", open && "rotate-180")} aria-hidden="true" />
          </span>
        </CollapsibleTrigger>
      </div>
      <CollapsibleContent>
        <div className="p-4">
          {!catalog
            ? <LoadingState title="Đang tải danh mục nguyên liệu…" />
            : <div className="min-w-0 space-y-3">
                <CategoryBar current={category} category={tree} counts={counts} onSelect={choose} />
                <MaterialToolbar text={text} onText={value => { setText(value); setAsked(""); setGroups([]); setPage(1); }} groups={groupOptions} selected={groups} counts={countByGroup(items, category, text)} onGroups={next => { setGroups(next); setPage(1); }} />
                <GroupChips groups={groupOptions} selected={groups} onChange={next => { setGroups(next); setPage(1); }} />
                <MaterialGrid items={pageItems} selectedIds={selectedIds} columns={COLUMNS} onOpen={readOnly || pickDisabled ? undefined : onPick} />
                <NumberedPager current={currentPage} total={totalPages} onGo={setPage} />
              </div>}
        </div>
      </CollapsibleContent>
    </Collapsible>
  </section>;
}
