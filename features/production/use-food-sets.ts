"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { useAccess } from "@/lib/access-boundary";
import { toast } from "@/components/ui/toast";
import { createFoodSet, getFoodSet, listFoodSets, updateFoodSet, retireFoodSet, getDraftProducts, type DraftProduct, type FoodSet, type FoodPackage, type SetSlot } from "@/lib/api/sales";
import { evaluateFoodSet, type EvaluatedFoodSet, type SlotSelection } from "@/lib/api/production";
import { isStale, loadPackOptions, packMessage } from "./pack-shared";
import { initialSetMetadata, isLastKeptSpice, normalizeFilterTag, parseTags, slotCountMessage, tagError as tagRule, validSlotSet } from "./food-set-rules";

export function useFoodSets() {
  const { can } = useAccess();
  const canReadRecipe = can("production:recipe:read");
  const canCreate = can("sales:variant:create");
  const canUpdate = can("sales:variant:update");
  const canDelete = can("sales:variant:delete");
  const [rows, setRows] = useState<FoodSet[]>([]);
  const [products, setProducts] = useState<DraftProduct[]>([]);
  const [packages, setPackages] = useState<FoodPackage[]>([]);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [search, setSearch] = useState("");
  const [filterTags, setFilterTags] = useState<string[]>([]);
  const [filterTagDraft, setFilterTagDraft] = useState("");
  const [seenFilterTags, setSeenFilterTags] = useState<string[]>([]);
  const [cursor, setCursor] = useState<string | undefined>();
  const [next, setNext] = useState<string | null>(null);
  const [selected, setSelected] = useState<FoodSet | null>(null);
  const [editing, setEditing] = useState(false);
  const [metadata, setMetadata] = useState(initialSetMetadata);
  const [tagText, setTagText] = useState("");
  const [touched, setTouched] = useState(false);
  const [slots, setSlots] = useState<SetSlot[]>([]);
  const [selections, setSelections] = useState<SlotSelection[]>([]);
  const [evaluation, setEvaluation] = useState<EvaluatedFoodSet | null>(null);
  const [evaluateError, setEvaluateError] = useState("");
  const [evaluating, setEvaluating] = useState(false);
  const [evaluateRetry, setEvaluateRetry] = useState(0);
  const [detailBusy, setDetailBusy] = useState(false);
  const [refresh, setRefresh] = useState(0);
  const [confirmRetire, setConfirmRetire] = useState(false);
  const mounted = useRef(false);
  const loadRequest = useRef(0);
  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);
  const load = async () => {
    if (!mounted.current) return;
    const request = ++loadRequest.current;
    setBusy(true); setError("");
    try {
      const page = await listFoodSets({ q: search, tags: filterTags, cursor, limit: 20 });
      if (request !== loadRequest.current) return;
      setRows(page.items); setNext(page.next_cursor);
      setSeenFilterTags(current => [...new Set([...current, ...page.items.flatMap(row => [...row.tags, ...row.system_hashtags])])]);
    } catch (e) { if (request === loadRequest.current) setError(packMessage(e)); }
    finally { if (request === loadRequest.current) setBusy(false); }
  };
  useEffect(() => {
    void load();
    return () => { loadRequest.current++; };
  }, [search, filterTags, cursor, refresh]);
  useEffect(() => {
    if (!selected || !canReadRecipe) return;
    let active = true;
    setEvaluating(true); setEvaluation(null); setEvaluateError("");
    evaluateFoodSet(selected.id, { expected_updated_at: selected.updated_at, selections }).then(value => { if (active) setEvaluation(value); })
      .catch(e => { if (active) setEvaluateError(packMessage(e)); })
      .finally(() => { if (active) setEvaluating(false); });
    return () => { active = false; };
  }, [selected, selections, canReadRecipe, evaluateRetry]);
  const open = async (row: FoodSet) => {
    setDetailBusy(true); setError(""); setEvaluation(null); setEvaluateError("");
    try {
      const [current, options] = await Promise.all([getFoodSet(row.id), loadPackOptions()]);
      if (!mounted.current) return;
      setSelected(current); setPackages(options); setTagText(current.tags.join(", "));
      setSlots(current.slots); setSelections([]); setEditing(false);
    } catch (e) { if (mounted.current) setError(packMessage(e)); }
    finally { if (mounted.current) setDetailBusy(false); }
  };
  const begin = async (create: boolean) => {
    setDetailBusy(true); setError(""); setTouched(false);
    try {
      const [families, options] = await Promise.all([getDraftProducts(), loadPackOptions()]);
      if (!mounted.current) return;
      setProducts(families); setPackages(options);
      if (create) { setSelected(null); setMetadata(initialSetMetadata); setTagText(""); setSlots([]); }
      setEditing(true);
    } catch (e) { if (mounted.current) setError(packMessage(e)); }
    finally { if (mounted.current) setDetailBusy(false); }
  };
  const tags = parseTags(tagText);
  const tagError = tagRule(tags, selected?.system_hashtags);
  const slotCountError = slotCountMessage(slots);
  const validSlots = validSlotSet(slots);
  const nonRemovable = (slot: SetSlot) => isLastKeptSpice(slots, slot);
  const valid = !tagError && (selected ? validSlots : !!metadata.product_ref && !!metadata.code.trim() && !!metadata.name.trim() && !!metadata.variant_label.trim() && metadata.net_weight_g > 0 && !!metadata.temperature_regime.trim());
  const save = async (event: FormEvent) => {
    event.preventDefault(); setTouched(true); if (!valid || detailBusy || (selected ? !canUpdate : !canCreate)) return;
    setDetailBusy(true); setError("");
    try {
      const saved = selected ? await updateFoodSet(selected.id, { tags, slots, expected_updated_at: selected.updated_at }) : await createFoodSet({ ...metadata, tags });
      if (!mounted.current) return;
      setSelected(saved); setSlots(saved.slots); setTagText(saved.tags.join(", ")); setSelections([]); setEditing(false);
      toast.success("Đã lưu set"); setRefresh(value => value + 1);
    } catch (e) {
      if (!mounted.current) return;
      if (isStale(e)) { toast.error("Dữ liệu đã đổi, tải lại"); setEditing(false); if (selected) await open(selected); if (mounted.current) setRefresh(value => value + 1); }
      else setError(packMessage(e));
    } finally { if (mounted.current) setDetailBusy(false); }
  };
  const retire = async () => {
    setConfirmRetire(false);
    if (!selected || !canDelete || detailBusy) return;
    setDetailBusy(true);
    try {
      await retireFoodSet(selected.id);
      if (!mounted.current) return;
      setSelected(null); setEditing(false); toast.success("Đã ngừng set"); setRefresh(value => value + 1);
    } catch (e) {
      if (!mounted.current) return;
      if (isStale(e)) { toast.error("Dữ liệu đã đổi, tải lại"); await open(selected); if (mounted.current) setRefresh(value => value + 1); }
      else setError(packMessage(e));
    }
    finally { if (mounted.current) setDetailBusy(false); }
  };
  const changeSlot = (index: number, change: Partial<SetSlot>) => setSlots(current => current.map((row, i) => i === index ? { ...row, ...change } : row));
  const submitSearch = () => { setCursor(undefined); setSearch(query); };
  const toggleFilterTag = (value: string) => {
    const tag = normalizeFilterTag(value);
    if (!tag) return;
    setCursor(undefined);
    setFilterTags(current => current.includes(tag) ? current.filter(item => item !== tag) : [...current, tag]);
  };
  const addFilterTags = (value: string) => {
    const added = value.split(",").map(normalizeFilterTag).filter(Boolean);
    if (!added.length) return;
    setCursor(undefined);
    setFilterTags(current => [...new Set([...current, ...added])]);
  };
  const clearTagFilters = () => { setCursor(undefined); setFilterTags([]); setFilterTagDraft(""); };
  const availableTags = [...new Set([...seenFilterTags, ...filterTags, ...(selected?.tags ?? []), ...(selected?.system_hashtags ?? [])])].sort();
  return {
    canReadRecipe, canCreate, canUpdate, canDelete,
    rows, products, packages, busy, error, query, setQuery, filterTags, filterTagDraft, setFilterTagDraft, cursor, setCursor, next,
    selected, editing, setEditing, metadata, setMetadata, tagText, setTagText, touched, setTouched, slots, setSlots,
    selections, setSelections, evaluation, evaluateError, evaluating, setEvaluateRetry, detailBusy, confirmRetire, setConfirmRetire,
    tags, tagError, slotCountError, validSlots, valid, availableTags,
    load, open, begin, save, retire, changeSlot, nonRemovable, submitSearch, toggleFilterTag, addFilterTags, clearTagFilters,
  };
}

export type FoodSetsState = ReturnType<typeof useFoodSets>;
