"use client";

import type { Route } from "next";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import * as api from "@/lib/api/dishes";
import { fetchDishMedia, removeDishImage, uploadDishImage, validateDishImage } from "@/lib/api/dish-images";
import { getMaterialTree, listMaterials } from "@/lib/api/material-catalog";
import { getRawLabels } from "@/lib/api/sales";
import { useAccess } from "@/lib/access-boundary";
import { validateDish } from "@/lib/dishes/validate-dish";
import { blockingCostErrors } from "@/lib/dishes/precheck-cost";
import { SemiFinishedSheet } from "./semi-finished-sheet";
import { useSemiFinished } from "./use-semi-finished";
import type { SemiSlot } from "@/lib/api/semi-finished";
import { allergenSummary } from "@/lib/dishes/allergens";
import type { DishDetail } from "@/lib/dishes/dish-detail";
import type { DishContent, DishDraft } from "@/lib/dishes/types";
import { Button, buttonVariants } from "@/components/ui/button";
import { PageShell } from "@/components/ui/page";
import { toast } from "@/components/ui/toast";
import { LoadingState } from "@/components/patterns/empty-state";
import { InlineAlert } from "@/components/patterns/inline-alert";
import { PageHeading } from "@/components/patterns/page-heading";
import { DishListView } from "./dish-list-view";
import { DishEditorView } from "./dish-editor-view";
import { DishIngredientsView } from "./dish-ingredients-view";
import { DishDraftBody } from "./dish-draft-body";
import { DishCostView } from "./dish-cost-view";
import { DishDetailView } from "./dish-detail-view";
import { DishImageBox } from "./dish-image-box";
import { emptyContent, useDishDetail, useDishList } from "./use-dishes";
import { useDishDraft } from "./use-dish-draft";
import { useDishData } from "./use-dish-data";

const dataApi = { ...api, getMaterialTree, listMaterials, getRawLabels };

export function DishListScreen({ initialTab = "dishes" }: { initialTab?: "dishes" | "drafts" | "semi" }) {
  const router = useRouter();
  const canCreate = useAccess().can("sales:product:create");
  const [activeTab, setActiveTab] = useState<"dishes" | "drafts" | "semi">(initialTab);
  const [semiSheetOpen, setSemiSheetOpen] = useState(false);
  const [semiDefaultSlot, setSemiDefaultSlot] = useState<SemiSlot>("DO_CHUA");
  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);
  const list = useDishList(api, {
    onOpenDraft: id => router.push(`/production/dishes/drafts/${id}` as Route),
  });
  const semi = useSemiFinished(activeTab === "semi");
  const onDiscardDraft = async (id: string) => {
    if (await list.discardDraft(id)) toast.success("Đã bỏ nháp");
  };
  return <PageShell>
    <PageHeading
      className="mb-6"
      title="Món ăn & công thức"
      description="Xây dựng định mức nguyên liệu, gia vị và kiểm tra giá vốn trước khi đưa món vào chỉ tiêu sản xuất."
      actions={
        <div className="flex flex-wrap gap-2">
          <Link className={buttonVariants({ variant: "outline", size: "sm" })} href="/production/materials">Danh mục nguyên liệu</Link>
          <Link className={buttonVariants({ variant: "outline", size: "sm" })} href="/production/targets">Sang chỉ tiêu sản xuất</Link>
        </div>
      }
    />
    <DishListView
      rows={list.rows}
      drafts={list.drafts}
      draftNext={list.draftNext}
      draftBusy={list.draftBusy}
      draftsLoading={list.draftsLoading}
      draftError={list.draftError}
      initialTab={initialTab}
      semiItems={semi.items}
      semiLoading={semi.loading}
      semiError={semi.error}
      q={list.q}
      status={list.status}
      page={list.page}
      totalPages={list.totalPages}
      busy={list.busy}
      error={list.error}
      canCreate={canCreate}
      onQ={list.setQ}
      onStatus={list.setStatus}
      onPage={list.setPage}
      onTabChange={next => {
        setActiveTab(next);
        router.replace((next === "drafts" ? "/production/dishes?tab=drafts" : next === "semi" ? "/production/dishes?tab=semi" : "/production/dishes") as Route, { scroll: false });
      }}
      onCreate={() => void list.createDish()}
      onCreateSemi={slot => {
        setSemiDefaultSlot(slot ?? "DO_CHUA");
        setSemiSheetOpen(true);
      }}
      onRetrySemi={() => void semi.reload()}
      onMoreDrafts={() => void list.loadMoreDrafts()}
      onDiscardDraft={onDiscardDraft}
      onRetry={() => void list.load()}
    />
    <SemiFinishedSheet
      open={semiSheetOpen}
      defaultSlot={semiDefaultSlot}
      onOpenChange={setSemiSheetOpen}
      onCreated={async item => {
        await semi.prepend(item);
        toast.success(`Đã tạo bán thành phẩm "${item.name}"`);
      }}
    />
  </PageShell>;
}

export function DishDetailScreen({ dishId, initialVariant }: { dishId: string; initialVariant?: string }) {
  const router = useRouter();
  const access = useAccess();
  const canCreate = access.can("sales:product:create");
  const canEditImage = access.can("sales:product:update");
  const [imageBusy, setImageBusy] = useState(false);
  const [imageError, setImageError] = useState("");
  const detailState = useDishDetail(dishId, initialVariant, api, {
    onOpenDraft: id => { setImageError(""); router.push(`/production/dishes/drafts/${id}` as Route); },
    onExistingRevision: id => {
      toast.info("Biến thể này đang có bản sửa dở, đã mở tiếp");
      router.push(`/production/dishes/drafts/${id}` as Route);
    },
    onSelectVariant: setRef => router.replace(`/production/dishes/${dishId}?variant=${encodeURIComponent(setRef)}` as Route, { scroll: false }),
  });

  const variant = detailState.detail?.variants.find(v => v.set_ref === detailState.selected);
  const detailContent = useMemo((): DishContent | null => !detailState.detail || !variant ? null : {
    ...emptyContent(),
    name: detailState.detail.product.name,
    category_ref: detailState.detail.product.category_ref,
    servings: variant.servings,
    variant_note: variant.variant_note,
    ingredients: variant.packs.flatMap(pack => pack.lines.map((line, index) => ({ ...line, row: `${pack.slot}-${index}` }))),
    seasonings: variant.seasonings.map((line, index) => ({ row: `${line.slot}-${index}`, slot: line.slot, package_ref: line.package_ref, removable: line.removable })),
  }, [detailState.detail, variant]);
  const data = useDishData(detailContent, dataApi);
  const semi = useSemiFinished(Boolean(detailContent?.seasonings.length));

  const uploadExistingImage = async (file: File) => {
    if (!detailState.detail) return;
    const product = detailState.detail.product;
    setImageBusy(true); setImageError("");
    try {
      const res = await uploadDishImage(product.id, file, product.updated_at, product.image_urls?.length ?? 0);
      detailState.updateDetailMedia(res.imageUrls, res.updatedAt);
    } catch (e) {
      setImageError(e instanceof Error ? api.safeMessage(e.message) : "Không tải ảnh lên được");
    } finally { setImageBusy(false); }
  };

  const removeExistingImage = async () => {
    if (!detailState.detail) return;
    const product = detailState.detail.product;
    const existing = product.image_urls ?? [];
    if (!existing.length) return;
    setImageBusy(true); setImageError("");
    try {
      const updatedAt = product.updated_at ?? (await fetchDishMedia(product.id)).updatedAt;
      const res = await removeDishImage(product.id, 0, existing.length, updatedAt);
      detailState.updateDetailMedia(res.imageUrls, res.updatedAt);
    } catch (e) {
      setImageError(e instanceof Error ? api.safeMessage(e.message) : "Không xoá ảnh được");
    } finally { setImageBusy(false); }
  };

  const renameExistingDish = async (nextName: string) => {
    if (!detailState.detail) return;
    const res = await api.renameDish(detailState.detail.product.id, nextName);
    detailState.updateDetailName(res.product.name, res.product.updated_at);
    toast.success("Đã đổi tên món");
  };

  const onDiscardDraft = async (id: string) => {
    if (await detailState.discardOpenDraft(id)) toast.success("Đã bỏ nháp");
  };

  const packNames = useMemo(() => Object.fromEntries([
    ...Object.entries(semi.byId).map(([id, item]) => [id, item.name]),
    ...(detailState.detail?.variants.flatMap(v => v.seasonings.map(line => [line.package_ref, line.package_name])) ?? []),
  ]), [semi.byId, detailState.detail]);
  const packComponents = useMemo(() => Object.fromEntries(
    detailState.detail?.variants.flatMap(v =>
      v.seasonings.flatMap(line => line.components?.length
        ? [[line.package_ref, line.components.map(c => ({ ...c, name: data.materials[c.sku_ref]?.name }))]]
        : []
      )
    ) ?? [],
  ), [detailState.detail, data.materials]);
  const detailAllergens = [
    ...(detailContent?.ingredients.flatMap(line => line.sku_ref ? [data.materials[line.sku_ref]?.allergens ?? null] : []) ?? []),
    ...(detailContent?.seasonings.flatMap(line => line.package_ref && semi.byId[line.package_ref] ? [semi.byId[line.package_ref].allergens] : []) ?? []),
  ];
  const cost = <DishCostView cost={data.cost} packNames={packNames} loading={data.costLoading} error={data.costError} onRetry={data.retryCost} />;
  const detailImageBox = detailState.detail
    ? <DishImageBox current={detailState.detail.product.image_urls?.[0] ?? null} canEdit={canEditImage} busy={imageBusy || detailState.busy} error={imageError} onPick={file => void uploadExistingImage(file)} onRemove={() => void removeExistingImage()} />
    : null;

  return <PageShell>
    {data.error && <InlineAlert>{data.error} <Button variant="outline" onClick={() => void data.load()}>Thử lại</Button></InlineAlert>}
    {detailState.error && <InlineAlert>{detailState.error}<div className="mt-2 flex flex-wrap gap-2"><Button variant="outline" onClick={() => void detailState.load()}>Thử lại</Button><Button variant="outline" onClick={() => router.push("/production/dishes" as Route)}>Về danh sách món</Button></div></InlineAlert>}
    {(detailState.busy && !detailState.detail) && <LoadingState title="Đang tải món…" />}
    {detailState.detail
      ? <DishDetailView
          key={detailState.detail.product.id}
          detail={detailState.detail}
          selected={detailState.selected}
          variant={variant}
          busy={detailState.busy}
          canCreate={canCreate}
          canRename={canEditImage}
          onSelect={detailState.selectVariant}
          onBack={() => router.push("/production/dishes" as Route)}
          onCopy={() => { if (detailState.detail && variant) { setImageError(""); void detailState.begin("COPY", detailState.detail, variant); } }}
          onVariant={() => { if (detailState.detail && variant) { setImageError(""); void detailState.begin("VARIANT", detailState.detail, variant); } }}
          onRevision={() => { if (detailState.detail && variant) { setImageError(""); void detailState.begin("REVISION", detailState.detail, variant); } }}
          onRename={renameExistingDish}
          onDiscardDraft={onDiscardDraft}
        >
          <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
            {detailContent && <DishIngredientsView content={detailContent} materials={data.materials} tree={data.tree} packNames={packNames} semiById={semi.byId} packComponents={packComponents} catalogReady={data.catalogReady} semiLoading={semi.loading} allergensText={allergenSummary(detailAllergens)} readOnly onChange={() => {}} />}
            <div className="min-w-0 space-y-4 lg:sticky lg:top-4">{detailImageBox}{cost}</div>
          </div>
        </DishDetailView>
      : !detailState.busy && !detailState.error ? <LoadingState title="Đang tải món…" /> : null}
  </PageShell>;
}

export function DishDraftScreen({ draftId, fromDrafts }: { draftId: string; fromDrafts?: boolean }) {
  const router = useRouter();
  const listHref = fromDrafts ? "/production/dishes?tab=drafts" : "/production/dishes";
  const canEditImage = useAccess().can("sales:product:update");
  const [touched, setTouched] = useState(false);
  const [pendingImage, setPendingImage] = useState<{ file: File; preview: string } | null>(null);
  const [imageBusy, setImageBusy] = useState(false);
  const [imageError, setImageError] = useState("");
  const [sourceDetail, setSourceDetail] = useState<DishDetail | null>(null);
  const [semiSheetOpen, setSemiSheetOpen] = useState(false);
  const [semiDefaultSlot, setSemiDefaultSlot] = useState<SemiSlot>("DO_CHUA");
  const pendingRef = useRef(pendingImage);
  pendingRef.current = pendingImage;

  const clearPendingImage = useCallback(() => {
    setPendingImage(current => {
      if (current) URL.revokeObjectURL(current.preview);
      return null;
    });
  }, []);

  useEffect(() => () => {
    if (pendingRef.current) URL.revokeObjectURL(pendingRef.current.preview);
  }, []);

  useEffect(() => {
    clearPendingImage();
    setImageError("");
    setTouched(false);
  }, [draftId, clearPendingImage]);

  const onComplete = useCallback(async (productRef: string, setRef: string) => {
    const pending = pendingRef.current;
    let uploadFailed = false;
    if (pending) {
      setImageBusy(true);
      try {
        await uploadDishImage(productRef, pending.file);
      } catch {
        uploadFailed = true;
      } finally {
        clearPendingImage();
        setImageBusy(false);
      }
    }
    if (uploadFailed) toast.error("Đã tạo món nhưng chưa tải được ảnh, chọn lại ở khung Ảnh món ăn");
    else toast.success("Đã hoàn tất món");
    const target = setRef ? `/production/dishes/${productRef}?variant=${encodeURIComponent(setRef)}` : `/production/dishes/${productRef}`;
    router.replace(target as Route);
  }, [clearPendingImage, router]);

  const onDiscard = useCallback((draft: DishDraft) => {
    clearPendingImage();
    toast.success("Đã bỏ nháp");
    const backToDish = (draft.kind === "VARIANT" || draft.kind === "REVISION") && draft.source_product_ref;
    const target = backToDish
      ? `/production/dishes/${draft.source_product_ref}${draft.source_set_ref ? `?variant=${encodeURIComponent(draft.source_set_ref)}` : ""}`
      : listHref;
    router.replace(target as Route);
  }, [clearPendingImage, listHref, router]);

  const onClosed = useCallback((draft: DishDraft) => {
    if (draft.product_ref) {
      const target = draft.set_ref ? `/production/dishes/${draft.product_ref}?variant=${encodeURIComponent(draft.set_ref)}` : `/production/dishes/${draft.product_ref}`;
      router.replace(target as Route);
      return;
    }
    toast.info("Nháp này đã đóng");
    router.replace(listHref as Route);
  }, [listHref, router]);

  const editor = useDishDraft(draftId, api, { onComplete, onDiscard, onClosed });

  useEffect(() => {
    if (!editor.dirty && !pendingImage) return;
    const handler = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ""; };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [editor.dirty, pendingImage]);

  const sourceProductRef = editor.draft?.source_product_ref ?? null;
  useEffect(() => {
    if (!sourceProductRef) { setSourceDetail(null); return; }
    let alive = true;
    void api.getDishDetail(sourceProductRef).then(loaded => { if (alive) setSourceDetail(loaded); }).catch(() => { if (alive) setSourceDetail(null); });
    return () => { alive = false; };
  }, [sourceProductRef]);

  const data = useDishData(editor.content, dataApi);
  const semi = useSemiFinished(!editor.frozen || Boolean(editor.content?.seasonings.length));
  const ctx = useMemo(() => {
    const inactiveEntries: Array<[string, "DRAFT" | "SUSPENDED" | "MISSING"]> = Object.entries(data.materials).flatMap<[string, "DRAFT" | "SUSPENDED" | "MISSING"]>(([id, m]) =>
      m.retired ? [[id, "SUSPENDED"]] : m.draft ? [[id, "DRAFT"]] : []
    );
    if (data.catalogReady && editor.content?.ingredients) {
      const seen = new Set(inactiveEntries.map(([id]) => id));
      for (const line of editor.content.ingredients) {
        if (line.sku_ref && !data.materials[line.sku_ref] && !seen.has(line.sku_ref)) {
          seen.add(line.sku_ref);
          inactiveEntries.push([line.sku_ref, "MISSING"]);
        }
      }
    }
    return {
      kind: editor.draft?.kind ?? "CREATE" as const,
      tree: data.tree,
      skuGroups: Object.fromEntries(Object.entries(data.materials).map(([id, material]) => [id, material.group])),
      inactiveSkus: Object.fromEntries(inactiveEntries),
      packagesWithRecipe: editor.content?.seasonings.flatMap(line => line.package_ref ? [line.package_ref] : []) ?? [],
      existingVariants: sourceDetail?.variants.flatMap(v => v.servings ? [{ servings: v.servings, variant_note: v.variant_note, set_ref: v.set_ref, variant_label: v.variant_label }] : []) ?? [],
      source_journey: sourceDetail?.variants.find(v => v.set_ref === editor.content?.base?.set_ref)?.journey,
    };
  }, [editor.draft?.kind, data.tree, data.materials, data.catalogReady, editor.content?.ingredients, editor.content?.seasonings, sourceDetail, editor.content?.base?.set_ref]);

  const costErrors = useMemo(
    () => editor.content && !data.costLoading && !data.costError && data.cost && !data.cost.complete ? blockingCostErrors(editor.content, data.cost) : [],
    [editor.content, data.costLoading, data.costError, data.cost]
  );
  const validation = editor.content ? [...validateDish(editor.content, ctx), ...costErrors] : [];
  const errors = touched || editor.errors.length ? (editor.errors.length ? editor.errors : validation) : [];
  const packNames = useMemo(() => Object.fromEntries([
    ...Object.entries(semi.byId).map(([id, item]) => [id, item.name]),
    ...(sourceDetail?.variants.flatMap(v => v.seasonings.map(line => [line.package_ref, line.package_name])) ?? []),
  ]), [semi.byId, sourceDetail]);
  const cost = <DishCostView cost={data.cost} packNames={packNames} loading={data.costLoading} error={data.costError} onRetry={data.retryCost} />;

  const pickPendingImage = (file: File) => {
    setImageError("");
    try {
      validateDishImage(file);
      const preview = URL.createObjectURL(file);
      setPendingImage(current => {
        if (current) URL.revokeObjectURL(current.preview);
        return { file, preview };
      });
    } catch (e) {
      setImageError(e instanceof Error ? e.message : "Chọn ảnh JPEG, PNG hoặc WebP tối đa 5 MB");
    }
  };

  const back = async () => {
    const { ok, discarded } = await editor.leave(Boolean(pendingRef.current));
    if (!ok) return;
    clearPendingImage();
    const draft = editor.draft;
    const backToDish = (draft?.kind === "VARIANT" || draft?.kind === "REVISION") && draft.source_product_ref;
    const target = backToDish
      ? `/production/dishes/${draft.source_product_ref}${draft.source_set_ref ? `?variant=${encodeURIComponent(draft.source_set_ref)}` : ""}`
      : listHref;
    if (discarded) router.replace(target as Route);
    else router.push(target as Route);
  };

  const isNewProductDraft = editor.draft?.kind === "CREATE" || editor.draft?.kind === "COPY";
  const draftImageBox = isNewProductDraft
    ? <DishImageBox
        current={pendingImage?.preview ?? null}
        canEdit={canEditImage && !editor.frozen && !editor.conflict}
        busy={imageBusy || editor.busy}
        error={imageError}
        hint="Ảnh sẽ tải lên khi bấm Hoàn tất món."
        onPick={pickPendingImage}
        onRemove={pendingImage ? () => { setImageError(""); clearPendingImage(); } : undefined}
      />
    : <DishImageBox
        current={sourceDetail?.product.image_urls?.[0] ?? null}
        canEdit={false}
        busy={false}
        hint="Ảnh chung của món, đổi ở trang chi tiết món."
        onPick={() => {}}
      />;

  const ingredientNames = editor.content?.ingredients.flatMap(line => line.sku_ref && data.materials[line.sku_ref] ? [data.materials[line.sku_ref].name] : []) ?? [];
  const backToDish = Boolean((editor.draft?.kind === "VARIANT" || editor.draft?.kind === "REVISION") && editor.draft.source_product_ref);

  return <PageShell>
    {data.error && <InlineAlert>{data.error} <Button variant="outline" onClick={() => void data.load()}>Thử lại</Button></InlineAlert>}
    {editor.error && <InlineAlert>{editor.error}<div className="mt-2 flex flex-wrap gap-2"><Button variant="outline" onClick={() => void editor.reload()}>Tải lại nháp</Button><Button variant="outline" onClick={() => router.push(listHref as Route)}>Về danh sách món</Button></div></InlineAlert>}
    {(editor.loading || (!editor.draft && !editor.error)) && <LoadingState title="Đang tải nháp món…" />}
    {editor.draft && editor.content && <div onBlurCapture={event => { if (!(event.relatedTarget instanceof HTMLButtonElement)) setTouched(true); }} onClickCapture={event => { if (event.target instanceof Element && event.target.closest("button")) setTouched(true); }}>
      <DishEditorView
        key={editor.draft.id}
        draft={editor.draft}
        content={editor.content}
        ingredientNames={ingredientNames}
        saveState={editor.saveState}
        busy={editor.busy || imageBusy || !data.canCreate}
        frozen={editor.frozen}
        conflict={editor.conflict}
        canEditName={canEditImage}
        catalogReady={data.catalogReady}
        backLabel={backToDish ? "Về chi tiết món" : "Về danh sách món"}
        errors={errors}
        validationErrors={validation}
        existingServings={ctx.existingVariants.map(v => v.servings)}
        onExistingVariant={setRef => {
          const id = editor.draft?.source_product_ref ?? editor.content?.base?.product_ref;
          if (id) router.push(`/production/dishes/${id}?variant=${encodeURIComponent(setRef)}` as Route);
        }}
        onChange={editor.change}
        onSave={() => void editor.save()}
        onComplete={() => void editor.complete()}
        onDiscard={() => void editor.discard()}
        onReload={() => void editor.reload()}
        onBack={() => void back()}
      >
        <DishDraftBody
          content={editor.content}
          data={data}
          packNames={packNames}
          semiItems={semi.items}
          semiLoading={semi.loading}
          semiError={semi.error}
          canCreateSemi={data.canCreate}
          errors={errors}
          readOnly={editor.frozen}
          disabled={editor.busy || imageBusy || editor.conflict || !data.canCreate}
          cost={cost}
          imageBox={draftImageBox}
          onRetrySemi={() => void semi.reload()}
          onOpenCreateSemi={slot => {
            setSemiDefaultSlot(slot);
            setSemiSheetOpen(true);
          }}
          onChange={editor.change}
        />
      </DishEditorView>
    </div>}
    <SemiFinishedSheet
      open={semiSheetOpen}
      defaultSlot={semiDefaultSlot}
      onOpenChange={setSemiSheetOpen}
      onCreated={async item => {
        await semi.prepend(item);
        toast.success(`Đã tạo bán thành phẩm "${item.name}"`);
        if (editor.content && !editor.frozen) {
          const row = `${item.slot}-${item.id}`;
          const removable = item.slot === "DO_CHUA";
          editor.change({
            ...editor.content,
            seasonings: [...editor.content.seasonings.filter(line => line.slot !== item.slot), { row, slot: item.slot, package_ref: item.id, removable }],
          });
        }
      }}
    />
  </PageShell>;
}
