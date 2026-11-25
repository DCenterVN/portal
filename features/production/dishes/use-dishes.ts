import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type * as api from "@/lib/api/dishes";
import type { DishDetail, Variant } from "@/lib/dishes/dish-detail";
import { toBase } from "@/lib/dishes/dish-detail";
import { type DishContent, type DraftKind, type DraftRow } from "@/lib/dishes/types";
import { FetchError } from "@/lib/fetcher";
import { matchesName, PAGE_SIZE } from "../materials-catalog";
import { z } from "zod";

type ListDeps = Pick<typeof api, "listAllDishes" | "listDishDrafts" | "createDishDraft" | "discardDishDraft" | "draftAttempt" | "safeMessage">;
type DetailDeps = Pick<typeof api, "getDishDetail" | "createDishDraft" | "discardDishDraft" | "draftAttempt" | "safeMessage">;

const existingSchema = z.object({ errors: z.object({ existing: z.object({ id: z.string() }) }) });

export const emptyContent = (): DishContent => ({ schema_version: 1, name: "", category_ref: null, tags: [], servings: 2, variant_note: null, ingredients: [], seasonings: [], reason: null, base: null });

export function copyDishName(name: string): string {
  const clean = name.replace(/\s*\(bản sao\)\s*$/i, "").trim();
  return clean ? `${clean} (bản sao)` : "(bản sao)";
}

export function useDishList(deps: ListDeps, callbacks: { onOpenDraft: (draftId: string) => void }) {
  const [allRows, setAllRows] = useState<api.DishListRow[]>([]);
  const [drafts, setDrafts] = useState<DraftRow[]>([]);
  const [draftNext, setDraftNext] = useState<string | null>(null);
  const [draftBusy, setDraftBusy] = useState(false);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [busy, setBusy] = useState(false);
  const [draftsLoaded, setDraftsLoaded] = useState(false);
  const [error, setError] = useState("");
  const [draftError, setDraftError] = useState("");
  const attempt = useRef(deps.draftAttempt());
  const request = useRef(0);
  const callbacksRef = useRef(callbacks);
  callbacksRef.current = callbacks;

  const load = useCallback(async () => {
    const version = ++request.current;
    setBusy(true); setError(""); setDraftError("");
    try {
      const [loaded, open] = await Promise.all([
        deps.listAllDishes(status),
        deps.listDishDrafts("status=OPEN&limit=5"),
      ]);
      if (version !== request.current) return;
      setAllRows(loaded);
      setDrafts(open.items);
      setDraftNext(open.next_cursor);
    } catch (e) {
      if (version === request.current) setError(e instanceof Error ? deps.safeMessage(e.message) : "Không tải được món");
    } finally {
      if (version === request.current) {
        setBusy(false);
        setDraftsLoaded(true);
      }
    }
  }, [status, deps]);

  useEffect(() => { void load(); return () => { request.current++; }; }, [load]);

  const loadMoreDrafts = useCallback(async () => {
    if (!draftNext || draftBusy) return;
    const version = request.current;
    setDraftBusy(true); setDraftError("");
    try {
      const nextPage = await deps.listDishDrafts(new URLSearchParams({ status: "OPEN", limit: "5", cursor: draftNext }).toString());
      if (version !== request.current) return;
      setDrafts(current => [...current, ...nextPage.items.filter(item => !current.some(row => row.id === item.id))]);
      setDraftNext(nextPage.next_cursor);
    } catch (e) {
      if (version === request.current) setDraftError(e instanceof Error ? deps.safeMessage(e.message) : "Không tải được nháp");
    } finally {
      setDraftBusy(false);
    }
  }, [draftNext, draftBusy, deps]);

  const discardDraft = useCallback(async (id: string) => {
    setDraftError("");
    try {
      await deps.discardDishDraft(id);
      setDrafts(current => current.filter(item => item.id !== id));
      return true;
    } catch (e) {
      setDraftError(e instanceof Error ? deps.safeMessage(e.message) : "Không bỏ được nháp");
      return false;
    }
  }, [deps]);

  const createDish = useCallback(async () => {
    setBusy(true); setError("");
    const input: api.CreateDraft = { kind: "CREATE", content: emptyContent() };
    try {
      const draft = await deps.createDishDraft(input, attempt.current(input));
      attempt.current.done();
      callbacksRef.current.onOpenDraft(draft.id);
    } catch (e) {
      setError(e instanceof Error ? deps.safeMessage(e.message) : "Không tạo được nháp");
    } finally {
      setBusy(false);
    }
  }, [deps]);

  const filtered = useMemo(() => allRows.filter(row => matchesName(row.product.name, q)), [allRows, q]);
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const rows = useMemo(() => filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE), [filtered, safePage]);

  return {
    rows,
    drafts,
    draftNext,
    draftBusy,
    q,
    setQ: (value: string) => { setPage(1); setQ(value); },
    status,
    setStatus: (value: string) => { setPage(1); setStatus(value); },
    page: safePage,
    totalPages,
    setPage,
    totalCount: filtered.length,
    busy,
    draftsLoading: busy && !draftsLoaded,
    error,
    draftError,
    load,
    loadMoreDrafts,
    discardDraft,
    createDish,
  };
}

export function useDishDetail(
  dishId: string,
  initialVariant: string | undefined,
  deps: DetailDeps,
  callbacks: { onOpenDraft: (draftId: string) => void; onExistingRevision: (draftId: string) => void; onSelectVariant: (setRef: string) => void }
) {
  const [detail, setDetail] = useState<DishDetail | null>(null);
  const [selected, setSelected] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const attempt = useRef(deps.draftAttempt());
  const request = useRef(0);
  const initialVariantRef = useRef(initialVariant);
  initialVariantRef.current = initialVariant;
  const callbacksRef = useRef(callbacks);
  callbacksRef.current = callbacks;

  const load = useCallback(async () => {
    const version = ++request.current;
    setBusy(true); setError("");
    try {
      const loaded = await deps.getDishDetail(dishId);
      if (version !== request.current) return;
      setDetail(loaded);
      setSelected(current => {
        const preferred = initialVariantRef.current || current;
        return loaded.variants.some(v => v.set_ref === preferred) ? preferred : loaded.variants[0]?.set_ref ?? "";
      });
    } catch (e) {
      if (version === request.current) setError(e instanceof Error ? deps.safeMessage(e.message) : "Không tải được món");
    } finally {
      if (version === request.current) setBusy(false);
    }
  }, [dishId, deps]);

  useEffect(() => { void load(); return () => { request.current++; }; }, [load]);

  useEffect(() => {
    if (!initialVariant || !detail) return;
    if (detail.variants.some(v => v.set_ref === initialVariant)) setSelected(initialVariant);
  }, [initialVariant, detail]);

  const selectVariant = useCallback((setRef: string) => {
    setSelected(setRef);
    callbacksRef.current.onSelectVariant(setRef);
  }, []);

  const updateDetailMedia = useCallback((image_urls: string[], updated_at: string) => {
    setDetail(current => current ? { ...current, product: { ...current.product, image_urls, updated_at } } : current);
  }, []);

  const updateDetailName = useCallback((name: string, updated_at?: string) => {
    setDetail(current => current ? { ...current, product: { ...current.product, name, ...(updated_at ? { updated_at } : {}) } } : current);
  }, []);

  const begin = useCallback(async (kind: Extract<DraftKind, "COPY" | "VARIANT" | "REVISION">, source: DishDetail, variant: Variant) => {
    const servings = variant.servings ?? 2;
    setBusy(true); setError("");
    const content = {
      ...emptyContent(),
      name: kind === "COPY" ? copyDishName(source.product.name) : source.product.name,
      category_ref: source.product.category_ref,
      tags: kind === "COPY" ? [] : (variant.tags ?? []),
      servings,
      variant_note: kind === "VARIANT" ? "" : (variant.variant_note ?? null),
      base: toBase(variant, source.product.id),
      ingredients: variant.packs.flatMap(pack => pack.lines.map(line => ({ ...line, row: crypto.randomUUID() }))),
      seasonings: variant.seasonings.map(line => ({ row: crypto.randomUUID(), slot: line.slot, package_ref: line.package_ref, removable: line.removable })),
    };
    const input: api.CreateDraft = { kind, content, source_product_ref: source.product.id, source_set_ref: variant.set_ref };
    try {
      const draft = await deps.createDishDraft(input, attempt.current(input));
      attempt.current.done();
      callbacksRef.current.onOpenDraft(draft.id);
    } catch (e) {
      const found = e instanceof FetchError && e.status === 409 ? existingSchema.safeParse(e.info) : null;
      if (found?.success) {
        callbacksRef.current.onExistingRevision(found.data.errors.existing.id);
      } else {
        setError(e instanceof Error ? deps.safeMessage(e.message) : "Không tạo được nháp");
      }
    } finally {
      setBusy(false);
    }
  }, [deps]);

  const discardOpenDraft = useCallback(async (draftId: string) => {
    setError("");
    try {
      await deps.discardDishDraft(draftId);
      setDetail(current => current ? { ...current, open_drafts: current.open_drafts.filter(row => row.id !== draftId) } : current);
      return true;
    } catch (e) {
      setError(e instanceof Error ? deps.safeMessage(e.message) : "Không bỏ được nháp");
      return false;
    }
  }, [deps]);

  return {
    detail,
    selected,
    selectVariant,
    busy,
    error,
    load,
    begin,
    discardOpenDraft,
    updateDetailMedia,
    updateDetailName,
  };
}
