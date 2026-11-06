"use client";

import { useEffect, useId, useRef, useState } from "react";
import { z } from "zod";
import { useAccess } from "@/lib/access-boundary";
import { FetchError } from "@/lib/fetcher";
import { getMaterialCategories } from "@/lib/api/material-categories";
import type { MaterialCategory } from "@/lib/api/inventory/types";
import { createMaterial, getMaterials, type Material, type MaterialPage, type CreateMaterialInput, type ExistingMaterial } from "@/lib/api/sales";

const duplicateSchema = z.object({ errors: z.object({ existing: z.object({ id: z.string(), code: z.string(), name: z.string() }) }) });

export function useMaterialPicker(onSelect: (material: Material) => void) {
  const instance = useId();
  const [categories, setCategories] = useState<MaterialCategory[]>([]);
  const [categoryError, setCategoryError] = useState("");
  const [draft, setDraft] = useState("");
  const [existing, setExisting] = useState<ExistingMaterial | null>(null);
  const [createError, setCreateError] = useState("");
  const [creating, setCreating] = useState(false);
  const canCreate = useAccess().can("sales:product:create");
  const [reset, setReset] = useState(0);
  const [notice, setNotice] = useState("");
  const request = useRef(0);
  const createAttempt = useRef<{ payload: string; key: string } | null>(null);
  const [page, setPage] = useState<MaterialPage | null>(null);
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(true);
  const load = async (filter: string, cursor = "") => {
    const current = ++request.current;
    setBusy(true); setError("");
    try { const result = await getMaterials(`${filter}&cursor=${encodeURIComponent(cursor)}`); if (current === request.current) setPage(result); }
    catch (e) { if (current === request.current) { setPage(null); setError(e instanceof Error ? e.message : "Không tải được nguyên liệu"); } }
    finally { if (current === request.current) setBusy(false); }
  };
  const loadCategories = () => { setCategoryError(""); void getMaterialCategories().then(setCategories).catch(() => setCategoryError("Không tải được nhóm nguyên liệu")); };
  useEffect(() => { void load(""); loadCategories(); return () => { request.current++; }; }, []);
  const searchFilter = (filter: string) => { const params = new URLSearchParams(filter); if (draft.trim()) params.set("q", draft.trim()); return params.toString(); };
  const resetFilters = () => { setQuery(""); setDraft(""); setReset(current => current + 1); void load(""); };
  const selectCreated = (material: Material) => {
    onSelect(material); setNotice(`Đã chọn ${material.name} · ${material.sku_code}`); setCreating(false); resetFilters();
  };
  const handleCreate = async (input: CreateMaterialInput) => {
    const payload = JSON.stringify(input);
    if (createAttempt.current?.payload !== payload) createAttempt.current = { payload, key: crypto.randomUUID() };
    setCreateError(""); setExisting(null);
    try { selectCreated(await createMaterial(input, createAttempt.current.key)); createAttempt.current = null; }
    catch (e) {
      const duplicate = e instanceof FetchError && e.status === 409 ? duplicateSchema.safeParse(e.info) : null;
      if (duplicate?.success) setExisting(duplicate.data.errors.existing);
      else setCreateError(e instanceof Error ? e.message : "Không tạo được nguyên liệu");
    }
  };
  const pickExisting = async (existing: ExistingMaterial) => {
    setCreateError("");
    try {
      const result = await getMaterials(new URLSearchParams({ q: existing.code }).toString());
      const material = result.items.find(item => item.id === existing.id && item.selectable);
      if (!material) throw new Error("Không chọn được nguyên liệu đã có. Hãy tải lại danh sách.");
      selectCreated(material);
    } catch (e) { setCreateError(e instanceof Error ? e.message : "Không tải được nguyên liệu đã có"); }
  };
  return { instance, categories, categoryError, draft, setDraft, existing, setExisting, createError, setCreateError, creating, setCreating, canCreate, reset, notice, page, query, setQuery, error, busy, load, loadCategories, searchFilter, resetFilters, handleCreate, pickExisting };
}
