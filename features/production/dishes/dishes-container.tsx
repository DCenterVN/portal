"use client";
import { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import * as api from "@/lib/api/dishes";
import { getMaterialTree, listMaterials } from "@/lib/api/material-catalog";
import { getRawLabels } from "@/lib/api/sales";
import { validateDish } from "@/lib/dishes/validate-dish";
import type { DishContent } from "@/lib/dishes/types";
import { Button } from "@/components/ui/button";
import { PageShell } from "@/components/ui/page";
import { LoadingState } from "@/components/patterns/empty-state";
import { DishListView } from "./dish-list-view";
import { DishEditorView } from "./dish-editor-view";
import { DishIngredientsView } from "./dish-ingredients-view";
import { DishDraftBody } from "./dish-draft-body";
import { DishCostView } from "./dish-cost-view";
import { DishDetailView } from "./dish-detail-view";
import { useDishes, emptyContent, type DishLocation } from "./use-dishes";
import { useDishDraft } from "./use-dish-draft";
import { useDishData } from "./use-dish-data";
import { InlineAlert } from "@/components/patterns/inline-alert";
const dataApi = { ...api, getMaterialTree, listMaterials, getRawLabels };
export function DishesContainer({ mon, mode, draft: draftId }: DishLocation) {
  const router = useRouter();
  const [touched, setTouched] = useState(false);
  const navigate = useCallback((next: DishLocation) => {
    const query = new URLSearchParams({ tab: "dishes" });
    for (const [key, value] of Object.entries(next)) if (value) query.set(key, value);
    router.push(`/production/food-plans?${query}`);
  }, [router]);
  const location = useMemo(() => ({ mon, mode, draft: draftId }), [mon, mode, draftId]);
  const workspace = useDishes(location, api, navigate);
  const onComplete = useCallback((id: string) => { navigate({ mon: id }); void workspace.load(); }, [navigate, workspace.load]);
  const onDiscard = useCallback(() => { navigate({}); void workspace.load(); }, [navigate, workspace.load]);
  const editor = useDishDraft(draftId, api, onComplete, onDiscard);
  const variant = workspace.detail?.variants.find(v => v.set_ref === workspace.selected);
  const detailContent = useMemo((): DishContent | null => !workspace.detail || !variant ? null : { ...emptyContent(), name: workspace.detail.product.name, category_ref: workspace.detail.product.category_ref, servings: variant.servings, ingredients: variant.packs.flatMap(pack => pack.lines.map((line, index) => ({ ...line, row: `${pack.slot}-${index}` }))), seasonings: variant.seasonings.map(line => ({ row: line.slot, slot: line.slot, package_ref: line.package_ref, removable: line.removable })) }, [workspace.detail, variant]);
  const content = draftId ? editor.content : detailContent;
  const data = useDishData(content, dataApi);
  const ctx = useMemo(() => ({ kind: editor.draft?.kind ?? "CREATE" as const, tree: data.tree, skuGroups: Object.fromEntries(Object.entries(data.materials).map(([id, material]) => [id, material.group])), packagesWithRecipe: editor.content?.seasonings.flatMap(line => line.package_ref ? [line.package_ref] : []) ?? [], existingVariants: workspace.detail?.variants.flatMap(v => v.servings ? [{ servings: v.servings, set_ref: v.set_ref, variant_label: v.variant_label }] : []) ?? [], source_journey: workspace.detail?.variants.find(v => v.set_ref === editor.content?.base?.set_ref)?.journey }), [editor.draft?.kind, data.tree, data.materials, editor.content?.seasonings, workspace.detail, editor.content?.base?.set_ref]);
  const validation = editor.content ? validateDish(editor.content, ctx) : [];
  const validationErrors = editor.errors.length ? editor.errors : validation;
  const errors = touched || editor.errors.length ? validationErrors : [];
  const cost = <DishCostView cost={data.cost} loading={data.costLoading} error={data.costError} onRetry={data.retryCost} />;
  const begin = (kind: "COPY" | "VARIANT" | "REVISION") => { if (workspace.detail && variant) void workspace.begin(kind, workspace.detail, variant); };
  const back = async () => {
    if (editor.content && !editor.frozen && !editor.conflict && !await editor.save()) return;
    navigate({}); void workspace.load();
  };
  const packNames = useMemo(() => Object.fromEntries(workspace.detail?.variants.flatMap(v => v.seasonings.map(line => [line.package_ref, line.package_name])) ?? []), [workspace.detail]);
  const ingredientNames = editor.content?.ingredients.flatMap(line => line.sku_ref && data.materials[line.sku_ref] ? [data.materials[line.sku_ref].name] : []) ?? [];
  return <PageShell>
    {data.error && <InlineAlert>{data.error} <Button variant="outline" onClick={() => void data.load()}>Thử lại</Button></InlineAlert>}
    {editor.error && <InlineAlert>{editor.error}<Button variant="outline" onClick={() => void editor.reload()}>Tải lại nháp</Button></InlineAlert>}
    {workspace.error && (mon || draftId) && <InlineAlert>{workspace.error}<Button variant="outline" onClick={() => void workspace.load()}>Thử lại</Button></InlineAlert>}
    {workspace.existing && <Button variant="outline" onClick={() => navigate({ mon, draft: workspace.existing })}>Mở bản đang có</Button>}
    {(editor.loading || (mon && workspace.busy && !workspace.detail)) && <LoadingState title="Đang tải món…" />}
    {draftId && editor.draft && editor.content ? <div onBlurCapture={event => { if (!(event.relatedTarget instanceof HTMLButtonElement)) setTouched(true); }} onClickCapture={event => { if (event.target instanceof Element && event.target.closest("button")) setTouched(true); }}><DishEditorView key={editor.draft.id} draft={editor.draft} content={editor.content} ingredientNames={ingredientNames} saveState={editor.saveState} busy={editor.busy || !data.canCreate} frozen={editor.frozen} conflict={editor.conflict} errors={errors} validationErrors={validationErrors} existingServings={ctx.existingVariants.map(v => v.servings)} onExistingVariant={id => { workspace.setSelected(id); navigate({ mon: editor.content?.base?.product_ref }); }} onChange={editor.change} onSave={() => void editor.save()} onComplete={() => void editor.complete()} onDiscard={() => void editor.discard()} onReload={() => void editor.reload()} onBack={() => void back()}>
      <DishDraftBody content={editor.content} data={data} packNames={packNames} errors={errors} readOnly={editor.frozen} cost={cost} onChange={editor.change} />
    </DishEditorView></div> : mon && workspace.detail ? <DishDetailView detail={workspace.detail} selected={workspace.selected} variant={variant} busy={workspace.busy} canCreate={data.canCreate} onSelect={workspace.setSelected} onBack={() => navigate({})} onCopy={() => begin("COPY")} onVariant={() => begin("VARIANT")} onRevision={() => begin("REVISION")} onDraft={id => navigate({ mon, draft: id })}>
      {detailContent && <DishIngredientsView content={{ ...detailContent, seasonings: [] }} materials={data.materials} tree={data.tree} readOnly onChange={() => {}} />}{cost}
    </DishDetailView> : !mon && !draftId ? <DishListView rows={workspace.rows} drafts={workspace.drafts} draftNext={workspace.draftNext} draftBusy={workspace.draftBusy} onMoreDrafts={() => void workspace.loadMoreDrafts()} q={workspace.q} status={workspace.status} busy={workspace.busy} error={workspace.error} next={workspace.next} canCreate={data.canCreate} onQ={workspace.setQ} onStatus={workspace.setStatus} onCreate={() => void workspace.begin("CREATE")} onOpen={id => navigate({ mon: id })} onCopy={id => navigate({ mon: id, mode: "copy" })} onVariant={id => navigate({ mon: id, mode: "variant" })} onDraft={id => navigate({ draft: id })} onNext={() => workspace.setCursor(workspace.next ?? "")} onRetry={() => void workspace.load()} /> : !editor.loading && !workspace.busy && !editor.error && !workspace.error ? <LoadingState title="Đang tải món…" /> : null}
  </PageShell>;
}
