"use client";

import type { Route } from "next";
import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { LoadingState } from "@/components/patterns/empty-state";
import { Button } from "@/components/ui/button";
import { PageShell } from "@/components/ui/page";
import { RequireAction, useAccess } from "@/lib/access-boundary";
import { getMaterialTree, listMaterials, type MaterialCategory, type Material } from "@/lib/api/material-catalog";
import { UNCATEGORIZED, SEARCH_DELAY_MS, changeState, countByCategory, countByGroup, filterMaterials, groupsOf, pageCount, pageOf, readState, statusOf, stateQuery, type CatalogState, type StatusFilter } from "./materials-catalog";
import { MaterialCategorySheet } from "./material-category-sheet";
import { MaterialItemSheet } from "./material-item-sheet";
import { GroupChips } from "./material-group-filter";
import { MaterialToolbar } from "./material-toolbar";
import { CategoryBar, MaterialGrid, NumberedPager } from "./materials-view-parts";

export function MaterialsView() {
  return <RequireAction action="sales:product:read"><MaterialsCatalog /></RequireAction>;
}

function useCatalog(statusFilter: StatusFilter) {
  const [tree, setTree] = useState<MaterialCategory[]>([]);
  const [items, setItems] = useState<Material[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [version, setVersion] = useState(0);
  useEffect(() => {
    let live = true;
    setFailed(false);
    getMaterialTree().then(async loaded => {
      const list = await listMaterials(statusOf(statusFilter), loaded);
      if (live) { setTree(loaded); setItems(list); }
    }).catch(() => live && setFailed(true));
    return () => { live = false; };
  }, [statusFilter, version]);
  return { tree, items, failed, reload: useCallback(() => setVersion(value => value + 1), []) };
}

function MaterialsCatalog() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const { can } = useAccess();
  const first = readState(params, []);
  const { tree, items, failed, reload } = useCatalog(first.statusFilter);
  const state = readState(params, tree);
  const [text, setText] = useState(state.q);
  const [target, setTarget] = useState<Material | "new" | null>(null);
  const [managing, setManaging] = useState(false);
  const go = (change: Partial<CatalogState>) => router.replace(`${pathname}?${stateQuery(changeState(state, change))}` as Route);

  useEffect(() => {
    if (text.trim() === state.q.trim()) return;
    const timer = setTimeout(() => go({ q: text }), SEARCH_DELAY_MS);
    return () => clearTimeout(timer);
  });

  const counts = useMemo(() => countByCategory(items ?? []), [items]);
  const matches = useMemo(() => filterMaterials(items ?? [], state.category, state.q, state.groups), [items, state.category, state.q, state.groups]);
  const groupCounts = useMemo(() => countByGroup(items ?? [], state.category, state.q), [items, state.category, state.q]);
  const groups = groupsOf(tree, state.category);
  const total = pageCount(matches.length);
  const addLabel = can("sales:material:update") ? "Thêm nguyên liệu" : "Đề xuất nguyên liệu";

  return <PageShell>
    <h1 className="sr-only">Nguyên liệu</h1>
    <div className="flex items-center gap-4">
      <CategoryBar current={state.category} category={tree} counts={counts} onSelect={category => { setText(""); go({ category, q: "" }); }} onManage={can("inventory:material_category:update") ? () => setManaging(true) : undefined} />
      {can("sales:material:create") && <Button size="md" className="shrink-0" onClick={() => setTarget("new")}>{addLabel}</Button>}
    </div>
    <div className="mt-4 mb-4"><MaterialToolbar text={text} onText={setText} groups={groups} selected={state.groups} counts={groupCounts} onGroups={next => go({ groups: next })} status={state.statusFilter} onStatus={statusFilter => go({ statusFilter })} /></div>
    <GroupChips groups={groups} selected={state.groups} onChange={next => go({ groups: next })} />
    {failed ? <p role="alert" className="text-sm text-destructive">Chưa tải được danh mục, hãy tải lại trang.</p>
      : items === null ? <LoadingState title="Đang tải danh mục…" /> : <MaterialGrid items={pageOf(matches, state.page)} onOpen={setTarget} />}
    <NumberedPager current={Math.min(state.page, total)} total={total} onGo={page => go({ page })} />
    {target && <MaterialItemSheet key={target === "new" ? "new" : target.id} target={target} tree={tree} defaultCategory={state.category === UNCATEGORIZED ? tree[0]?.code ?? "" : state.category} onClose={() => setTarget(null)} onSaved={reload} />}
    <MaterialCategorySheet open={managing} tree={tree} onClose={() => setManaging(false)} onChanged={reload} />
  </PageShell>;
}
