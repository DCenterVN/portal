import { useCallback, useEffect, useRef, useState } from "react";
import type * as api from "@/lib/api/dishes";
import type { DishDetail, Variant } from "@/lib/dishes/dish-detail";
import { toBase } from "@/lib/dishes/dish-detail";
import type { DishContent, DraftKind, DraftRow } from "@/lib/dishes/types";
import { FetchError } from "@/lib/fetcher";
import { z } from "zod";
type Deps = Pick<typeof api, "listDishes" | "listDishDrafts" | "getDishDetail" | "createDishDraft" | "draftAttempt" | "safeMessage">;
export type DishLocation = { mon?: string; mode?: string; draft?: string };
const existingSchema = z.object({ errors: z.object({ existing: z.object({ id: z.string() }) }) });
export const emptyContent = (): DishContent => ({ schema_version: 1, name: "", category_ref: null, tags: [], servings: 2, ingredients: [], seasonings: [], reason: null, base: null });
export function useDishes(location: DishLocation, deps: Deps, navigate: (next: DishLocation) => void) {
  const [rows, setRows] = useState<api.DishListRow[]>([]);
  const [drafts, setDrafts] = useState<DraftRow[]>([]);
  const [draftNext, setDraftNext] = useState<string | null>(null);
  const [draftBusy, setDraftBusy] = useState(false);
  const [detail, setDetail] = useState<DishDetail | null>(null);
  const [selected, setSelected] = useState("");
  const [q, setQ] = useState("");
  const [category, setCategory] = useState("");
  const [status, setStatus] = useState("");
  const [cursor, setCursor] = useState("");
  const [next, setNext] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [existing, setExisting] = useState("");
  const attempt = useRef(deps.draftAttempt());
  const request = useRef(0);
  const load = useCallback(async () => {
    const version = ++request.current;
    setBusy(true); setError("");
    try {
      if (location.mon) {
        const loaded = await deps.getDishDetail(location.mon);
        if (version !== request.current) return;
        setDetail(loaded); setSelected(current => loaded.variants.some(v => v.set_ref === current) ? current : loaded.variants[0]?.set_ref ?? "");
      } else {
        const [page, open] = await Promise.all([deps.listDishes(new URLSearchParams({ q, category_ref: category, status, cursor, limit: "20" }).toString()), deps.listDishDrafts("status=OPEN&kind=CREATE,COPY&limit=20")]);
        if (version !== request.current) return;
        setRows(page.items); setNext(page.next_cursor); setDrafts(open.items); setDraftNext(open.next_cursor);
      }
    } catch (e) { if (version === request.current) setError(e instanceof Error ? deps.safeMessage(e.message) : "Không tải được món"); }
    finally { if (version === request.current) setBusy(false); }
  }, [location.mon, q, category, status, cursor, deps]);
  useEffect(() => { const timer = setTimeout(() => void load(), 250); return () => { clearTimeout(timer); request.current++; }; }, [load]);
  const loadMoreDrafts = async () => {
    if (!draftNext || draftBusy) return;
    const version = request.current;
    setDraftBusy(true); setError("");
    try {
      const page = await deps.listDishDrafts(new URLSearchParams({ status: "OPEN", kind: "CREATE,COPY", limit: "20", cursor: draftNext }).toString());
      if (version !== request.current) return;
      setDrafts(current => [...current, ...page.items.filter(item => !current.some(row => row.id === item.id))]);
      setDraftNext(page.next_cursor);
    } catch (e) { if (version === request.current) setError(e instanceof Error ? deps.safeMessage(e.message) : "Không tải được nháp"); }
    finally { setDraftBusy(false); }
  };
  const begin = useCallback(async (kind: DraftKind, source?: DishDetail, variant?: Variant) => {
    setBusy(true); setError(""); setExisting("");
    const content = emptyContent();
    if (source && variant) {
      Object.assign(content, { name: source.product.name, category_ref: source.product.category_ref, tags: variant.tags ?? [], servings: kind === "VARIANT" ? [4, 1, 2, 3, 6].find(n => !source.variants.some(v => v.servings === n)) ?? null : variant.servings, base: toBase(variant, source.product.id), ingredients: variant.packs.flatMap(pack => pack.lines.map(line => ({ ...line, row: crypto.randomUUID() }))), seasonings: variant.seasonings.map(line => ({ row: crypto.randomUUID(), slot: line.slot, package_ref: line.package_ref, removable: line.removable })) });
    }
    const input: api.CreateDraft = { kind, content, ...(source && variant ? { source_product_ref: source.product.id, source_set_ref: variant.set_ref } : {}) };
    try {
      const draft = await deps.createDishDraft(input, attempt.current(input));
      attempt.current.done();
      navigate({ mon: source?.product.id, mode: kind.toLowerCase(), draft: draft.id });
    } catch (e) {
      const found = e instanceof FetchError && e.status === 409 ? existingSchema.safeParse(e.info) : null;
      if (found?.success) {
        setExisting(found.data.errors.existing.id);
        setError("Đã có nháp bản sửa cho biến thể này. Mở bản đang có để tiếp tục.");
      } else setError(e instanceof Error ? deps.safeMessage(e.message) : "Không tạo được nháp");
    } finally { setBusy(false); }
  }, [deps, navigate]);
  const handledMode = useRef("");
  useEffect(() => {
    if (location.draft || !location.mode) return;
    const mode = location.mode;
    const key = `${location.mon ?? ""}:${mode}`;
    if (handledMode.current === key) return;
    const kind = mode === "create" ? "CREATE" : mode === "copy" ? "COPY" : mode === "variant" ? "VARIANT" : mode === "revision" ? "REVISION" : null;
    if (!kind || (kind !== "CREATE" && (!detail || detail.product.id !== location.mon))) return;
    handledMode.current = key;
    void begin(kind, detail ?? undefined, detail?.variants[0]);
  }, [location, detail, begin]);
  return { rows, drafts, draftNext, draftBusy, loadMoreDrafts, detail, selected, setSelected, q, setQ: (value: string) => { setCursor(""); setQ(value); }, category, setCategory: (value: string) => { setCursor(""); setCategory(value); }, status, setStatus: (value: string) => { setCursor(""); setStatus(value); }, next, setCursor, busy, error, existing, load, begin };
}
