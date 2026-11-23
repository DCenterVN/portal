"use client";

import { useMemo, useState } from "react";
import { LoadingState } from "@/components/patterns/empty-state";
import type { Material } from "@/lib/api/material-catalog";
import { countByCategory, countByGroup, filterMaterials, fold, groupsOf, pageCount, pageOf } from "../materials-catalog";
import { GroupChips } from "../material-group-filter";
import { MaterialToolbar } from "../material-toolbar";
import { CategoryBar, MaterialGrid, NumberedPager } from "../materials-view-parts";
import type { Catalog } from "./use-dish-data";

const COLUMNS = "grid-cols-3 gap-3 xl:grid-cols-4";

export function DishMaterialPicker({ catalog, selectedIds, onPick }: { catalog: Catalog | null; selectedIds: ReadonlySet<string>; onPick: (material: Material) => void }) {
  const [text, setText] = useState("");
  const [asked, setAsked] = useState("");
  const [groups, setGroups] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const items = useMemo(() => catalog?.items ?? [], [catalog]);
  const tree = useMemo(() => catalog?.tree ?? [], [catalog]);
  const counts = useMemo(() => countByCategory(items.filter(item => fold(item.name).includes(fold(text.trim())))), [items, text]);
  const category = (asked && counts[asked] ? asked : tree.find(item => item.active && counts[item.code])?.code) ?? asked;
  const matches = useMemo(() => filterMaterials(items, category, text, groups), [items, category, text, groups]);
  const groupOptions = groupsOf(tree, category);
  const choose = (next: string) => { setAsked(next); setGroups([]); setPage(1); };
  if (!catalog) return <LoadingState title="Đang tải danh mục nguyên liệu…" />;
  return <section aria-label="Danh mục nguyên liệu" className="min-w-0 space-y-3">
    <CategoryBar current={category} category={tree} counts={counts} onSelect={choose} />
    <MaterialToolbar text={text} onText={value => { setText(value); setPage(1); }} groups={groupOptions} selected={groups} counts={countByGroup(items, category, text)} onGroups={next => { setGroups(next); setPage(1); }} />
    <GroupChips groups={groupOptions} selected={groups} onChange={setGroups} />
    <MaterialGrid items={pageOf(matches, page)} selectedIds={selectedIds} columns={COLUMNS} onOpen={onPick} />
    <NumberedPager current={Math.min(page, pageCount(matches.length))} total={pageCount(matches.length)} onGo={setPage} />
  </section>;
}
