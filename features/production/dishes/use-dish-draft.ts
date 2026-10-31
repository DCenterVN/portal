import { useCallback, useEffect, useRef, useState } from "react";
import type * as api from "@/lib/api/dishes";
import type { DishContent, DishDraft } from "@/lib/dishes/types";
import type { DishError } from "@/lib/dishes/validate-dish";
import { FetchError } from "@/lib/fetcher";
import { z } from "zod";
type Deps = Pick<typeof api, "getDishDraft" | "saveDishDraft" | "finishDish" | "discardDishDraft" | "safeMessage">;
const errorsSchema = z.object({ errors: z.array(z.object({ row: z.string().optional(), field: z.string(), message: z.string(), existing: z.object({ set_ref: z.string(), variant_label: z.string() }).optional() })) });
export function useDishDraft(id: string | undefined, deps: Deps, onComplete: (product: string) => void, onDiscard: () => void) {
  const [draft, setDraft] = useState<DishDraft | null>(null);
  const [content, setContent] = useState<DishContent | null>(null);
  const [saveState, setSaveState] = useState("");
  const [error, setError] = useState("");
  const [errors, setErrors] = useState<DishError[]>([]);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(false);
  const [conflict, setConflict] = useState(false);
  const current = useRef<DishDraft | null>(null);
  const latest = useRef<DishContent | null>(null);
  const persisted = useRef("");
  const saving = useRef<Promise<boolean> | null>(null);
  const session = useRef(0);
  const frozen = !!draft && Object.keys(draft.progress).length > 0;
  const reload = useCallback(async () => {
    if (!id) { setDraft(null); setContent(null); current.current = null; latest.current = null; return; }
    const version = ++session.current;
    setLoading(true); setError("");
    try {
      const loaded = await deps.getDishDraft(id);
      if (version !== session.current) return;
      current.current = loaded; latest.current = loaded.content; persisted.current = JSON.stringify(loaded.content);
      setDraft(loaded); setContent(loaded.content); setConflict(false); setSaveState(""); setErrors([]);
    } catch (e) { if (version === session.current) setError(e instanceof Error ? deps.safeMessage(e.message) : "Không tải được nháp"); }
    finally { if (version === session.current) setLoading(false); }
  }, [id, deps]);
  useEffect(() => { void reload(); return () => { session.current++; }; }, [reload]);
  const change = (next: DishContent) => { latest.current = next; setContent(next); setSaveState("Chưa lưu"); setErrors([]); };
  const save = useCallback(async (): Promise<boolean> => {
    if (saving.current) { await saving.current; return save(); }
    const snapshot = latest.current, row = current.current;
    if (!snapshot || !row || conflict || Object.keys(row.progress).length) return false;
    if (JSON.stringify(snapshot) === persisted.current) return true;
    const version = session.current;
    const pending = (async () => {
      setSaveState("Đang lưu…");
      try {
        const saved = await deps.saveDishDraft(row.id, snapshot, row.revision);
        if (version !== session.current) return false;
        current.current = saved; setDraft(saved); persisted.current = JSON.stringify(snapshot);
        setSaveState(JSON.stringify(latest.current) === persisted.current ? `Đã lưu ${new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}` : "Chưa lưu");
        return true;
      } catch (e) {
        if (version !== session.current) return false;
        if (e instanceof FetchError && e.status === 409) { setConflict(true); setSaveState("Nháp đã đổi ở nơi khác — Tải lại"); }
        else setSaveState("Lưu lỗi — Thử lại");
        return false;
      }
    })();
    saving.current = pending;
    try { return await pending; } finally { saving.current = null; }
  }, [conflict, deps]);
  useEffect(() => {
    if (!content || conflict || frozen || busy || JSON.stringify(content) === persisted.current) return;
    const timer = setTimeout(() => void save(), 2000);
    return () => clearTimeout(timer);
  }, [content, conflict, frozen, busy, save]);
  const complete = async () => {
    if (!draft || busy || conflict) return;
    setBusy(true); setError(""); setErrors([]);
    try {
      if (!frozen && !await save()) return;
      const result = await deps.finishDish(draft.id);
      if (result.ok) onComplete(result.product_ref);
      else {
        const labels: Record<string, string> = { product: "tạo món", package: "tạo gói", recipe: "lưu công thức", set: "tạo biến thể", slots: "ghép gói", complete: "đóng nháp", validate: "kiểm tra" };
        setError(`Lỗi ở bước ${labels[result.failed_step.split(":")[0]] ?? "hoàn tất"}: ${deps.safeMessage(result.error.message)}. Bấm Hoàn tất món để tiếp tục.`);
        const updated = await deps.getDishDraft(draft.id); current.current = updated; setDraft(updated);
      }
    } catch (e) {
      const parsed = e instanceof FetchError ? errorsSchema.safeParse(e.info) : null;
      if (parsed?.success) setErrors(parsed.data.errors);
      else setError(e instanceof Error ? deps.safeMessage(e.message) : "Không hoàn tất được món");
    } finally { setBusy(false); }
  };
  const discard = async () => {
    if (!draft || busy) return;
    setBusy(true);
    try { if (saving.current) await saving.current; await deps.discardDishDraft(draft.id); onDiscard(); }
    catch (e) { setError(e instanceof Error ? deps.safeMessage(e.message) : "Không bỏ được nháp"); }
    finally { setBusy(false); }
  };
  return { draft, content, saveState, error, errors, busy, loading, conflict, frozen, change, save, reload, complete, discard };
}
