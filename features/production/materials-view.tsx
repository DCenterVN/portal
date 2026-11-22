"use client";

import type { Route } from "next";
import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { LoadingState } from "@/components/patterns/empty-state";
import { Button } from "@/components/ui/button";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { PageShell } from "@/components/ui/page";
import { RequireAction, useAccess } from "@/lib/access-boundary";
import { getMaterialTree, getMonList, type Loai, type Mon } from "@/lib/api/material-catalog";
import { CHUA_XEP, SEARCH_DELAY_MS, TRANG_THAI, changeState, countByLoai, countByNhom, filterMon, nhomOf, pageCount, pageOf, readState, statusOf, stateQuery, type CatalogState, type TrangThai } from "./materials-catalog";
import { LoaiSheet } from "./materials-loai-sheet";
import { MonSheet } from "./materials-mon-sheet";
import { NhomFilter } from "./materials-nhom-filter";
import { CategoryBar, MonGrid, NumberedPager } from "./materials-view-parts";

export function MaterialsView() {
  return <RequireAction action="sales:product:read"><MaterialsCatalog /></RequireAction>;
}

function useCatalog(trangThai: TrangThai) {
  const [tree, setTree] = useState<Loai[]>([]);
  const [items, setItems] = useState<Mon[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [version, setVersion] = useState(0);
  useEffect(() => {
    let live = true;
    setFailed(false);
    getMaterialTree().then(async loaded => {
      const list = await getMonList(statusOf(trangThai), loaded);
      if (live) { setTree(loaded); setItems(list); }
    }).catch(() => live && setFailed(true));
    return () => { live = false; };
  }, [trangThai, version]);
  return { tree, items, failed, reload: useCallback(() => setVersion(value => value + 1), []) };
}

function MaterialsCatalog() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const { can } = useAccess();
  const first = readState(params, []);
  const { tree, items, failed, reload } = useCatalog(first.trangThai);
  const state = readState(params, tree);
  const [text, setText] = useState(state.q);
  const [target, setTarget] = useState<Mon | "new" | null>(null);
  const [managing, setManaging] = useState(false);
  const go = (change: Partial<CatalogState>) => router.replace(`${pathname}?${stateQuery(changeState(state, change))}` as Route);

  useEffect(() => {
    if (text.trim() === state.q.trim()) return;
    const timer = setTimeout(() => go({ q: text }), SEARCH_DELAY_MS);
    return () => clearTimeout(timer);
  });

  const counts = useMemo(() => countByLoai(items ?? []), [items]);
  const matches = useMemo(() => filterMon(items ?? [], state.loai, state.q, state.nhom), [items, state.loai, state.q, state.nhom]);
  const nhomCounts = useMemo(() => countByNhom(items ?? [], state.loai, state.q), [items, state.loai, state.q]);
  const nhom = nhomOf(tree, state.loai);
  const total = pageCount(matches.length);
  const search = <InputGroup className="h-10 w-64 shrink-0 rounded-full"><InputGroupAddon><Search aria-hidden="true" /></InputGroupAddon><InputGroupInput value={text} onChange={event => setText(event.target.value)} placeholder="Tìm tên…" aria-label="Tìm nguyên liệu" /></InputGroup>;
  const addLabel = can("sales:material:update") ? "Thêm nguyên liệu" : "Đề xuất nguyên liệu";

  return <PageShell>
    <h1 className="sr-only">Nguyên liệu</h1>
    <div className="flex items-center gap-4">
      <CategoryBar current={state.loai} loai={tree} counts={counts} onSelect={loai => { setText(""); go({ loai, q: "" }); }} onManage={can("inventory:material_category:update") ? () => setManaging(true) : undefined} />
      {can("sales:material:create") && <Button size="md" className="shrink-0" onClick={() => setTarget("new")}>{addLabel}</Button>}
    </div>
    <div className="my-4 flex items-center justify-between gap-4">
      <div className="flex items-center gap-2">
        {nhom.length > 0 && <NhomFilter nhom={nhom} selected={state.nhom} counts={nhomCounts} onChange={next => go({ nhom: next })} />}
        <NativeSelect aria-label="Trạng thái nguyên liệu" className="w-36" value={state.trangThai} onChange={event => go({ trangThai: event.target.value as TrangThai })}>
          {TRANG_THAI.map(item => <NativeSelectOption key={item.slug} value={item.slug}>{item.label}</NativeSelectOption>)}
        </NativeSelect>
      </div>
      {search}
    </div>
    {failed ? <p role="alert" className="text-sm text-destructive">Chưa tải được danh mục, hãy tải lại trang.</p>
      : items === null ? <LoadingState title="Đang tải danh mục…" /> : <MonGrid items={pageOf(matches, state.trang)} onOpen={setTarget} />}
    <NumberedPager current={Math.min(state.trang, total)} total={total} onGo={trang => go({ trang })} />
    {target && <MonSheet key={target === "new" ? "new" : target.id} target={target} tree={tree} defaultLoai={state.loai === CHUA_XEP ? tree[0]?.code ?? "" : state.loai} onClose={() => setTarget(null)} onSaved={reload} />}
    <LoaiSheet open={managing} tree={tree} onClose={() => setManaging(false)} onChanged={reload} />
  </PageShell>;
}
