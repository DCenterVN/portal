"use client";

import { useEffect, useRef, useState } from "react";
import { z } from "zod";
import messages from "@/messages/vi.json";
import { apiFetch } from "@/lib/fetcher";
import { type AgreementLine } from "@/lib/api/supplier-agreements";

export type AgreementDraftValues = { code: string; from: string; to: string; lines: AgreementLine[]; needsFile: boolean };
type DraftStorage = Pick<Storage, "getItem" | "setItem" | "removeItem">;
type DraftResult = { kind: "empty" | "conflict" | "unavailable" } | { kind: "restored"; values: AgreementDraftValues };
type AgreementCommand = { body: string; key: string };
type DraftOptions = { supplierId: string; agreementId?: string; baseVersion: number | null; allowed: boolean; dirty: boolean; values: AgreementDraftValues; restore: (values: AgreementDraftValues) => void };
const prefix = "inventory:agreement-draft:v1:";
const text = z.string().max(500);
const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const lineSchema = z.object({ sku_ref: z.union([z.string().uuid(), z.literal("")]), uom: text, unit_price_vnd: z.number().int().nonnegative().nullable(), valid_from: date, valid_to: date, tax_treatment: text, delivery_treatment: text });
const savedSchema = z.object({ schema: z.literal(1), savedAt: z.number(), baseVersion: z.number().int().positive().nullable(), code: text, from: date, to: date, lines: z.array(lineSchema).min(1).max(100), needsFile: z.boolean() });
const contextSchema = z.object({ user: z.object({ id: z.string().min(1) }), active_context: z.object({ org_id: z.string().min(1), branch_id: z.string().min(1) }) });

export const draftStorageKey = (actor: string, org: string, branch: string, supplier: string, agreement: string) => prefix + JSON.stringify([actor, org, branch, supplier, agreement]);
export function nextAgreementCommand(previous: AgreementCommand, body: string, uuid: () => string = () => crypto.randomUUID()): AgreementCommand {
  return previous.body === body ? previous : { body, key: uuid() };
}
export function readAgreementDraft(storage: DraftStorage, key: string, version: number | null, now = Date.now()): DraftResult {
  let raw: string | null;
  try { raw = storage.getItem(key); } catch { return { kind: "unavailable" }; }
  try {
    if (!raw) return { kind: "empty" };
    const parsed = savedSchema.safeParse(JSON.parse(raw));
    if (!parsed.success || now - parsed.data.savedAt >= 86400000 || parsed.data.savedAt > now) {
      storage.removeItem(key); return { kind: "empty" };
    }
    if (parsed.data.baseVersion !== version) return { kind: "conflict" };
    const { code, from, to, lines, needsFile } = parsed.data;
    return { kind: "restored", values: { code, from, to, needsFile, lines: lines.map(line => ({ ...line, unit_price_vnd: line.unit_price_vnd ?? Number.NaN })) } };
  } catch {
    try { storage.removeItem(key); } catch { return { kind: "unavailable" }; }
    return { kind: "empty" };
  }
}
export function writeAgreementDraft(storage: DraftStorage, key: string, version: number | null, values: AgreementDraftValues, now = Date.now()): boolean {
  try {
    const lines = values.lines.map(({ sku_ref, uom, unit_price_vnd, valid_from, valid_to, tax_treatment, delivery_treatment }) => ({ sku_ref, uom, unit_price_vnd: Number.isNaN(unit_price_vnd) ? null : unit_price_vnd, valid_from, valid_to, tax_treatment, delivery_treatment }));
    const saved = savedSchema.parse({ schema: 1, savedAt: now, baseVersion: version, code: values.code, from: values.from, to: values.to, lines, needsFile: values.needsFile });
    storage.setItem(key, JSON.stringify(saved)); return true;
  } catch { return false; }
}
type DraftDestination = { url: string };
type DraftNavigationEvent = Event & { destination?: DraftDestination };
type DraftWindow = Window & { navigation?: EventTarget };
let cleanupInstalled = false;
export function clearOtherDrafts(storage: Storage, scope: string) {
  const keys = Array.from({ length: storage.length }, (_, index) => storage.key(index));
  for (const key of keys) if (key?.startsWith(prefix) && (!scope || !key.startsWith(scope))) storage.removeItem(key);
}
function installDraftCleanup() {
  if (cleanupInstalled) return;
  cleanupInstalled = true;
  const clear = () => { try { clearOtherDrafts(sessionStorage, ""); } catch { /* Storage có thể bị trình duyệt chặn. */ } };
  // Listener sống qua việc đóng editor để xóa nháp khi đăng xuất ở màn khác.
  (window as DraftWindow).navigation?.addEventListener("navigate", event => {
    const destination = (event as DraftNavigationEvent).destination;
    if (destination && /^\/(staff\/login|login|switch-branch|switch-org)(?:\/|$)/.test(new URL(destination.url).pathname)) clear();
  });
  const hadSession = document.cookie.split(";").some(cookie => cookie.trim().startsWith("CSRF-Token="));
  window.addEventListener("beforeunload", () => {
    if (hadSession && !document.cookie.split(";").some(cookie => cookie.trim().startsWith("CSRF-Token="))) clear();
  });
}
export function useSupplierAgreementDraft(options: DraftOptions) {
  const { supplierId, agreementId, baseVersion, allowed, dirty, values } = options;
  const latest = useRef(options);
  latest.current = options;
  const [key, setKey] = useState("");
  const [notice, setNotice] = useState("");
  const stopped = useRef(false);
  useEffect(() => {
    if (!allowed) return;
    let live = true;
    stopped.current = false;
    installDraftCleanup();
    async function restore() {
      try {
        const response = await apiFetch("/api/auth/context", { cache: "no-store" });
        if (!response.ok) throw Error("context");
        const context = contextSchema.parse(await response.json());
        if (!live) return;
        const scope = prefix + JSON.stringify([context.user.id, context.active_context.org_id, context.active_context.branch_id]).slice(0, -1) + ",";
        clearOtherDrafts(sessionStorage, scope);
        const storageKey = draftStorageKey(context.user.id, context.active_context.org_id, context.active_context.branch_id, supplierId, agreementId ?? "new");
        const result = readAgreementDraft(sessionStorage, storageKey, baseVersion);
        if (result.kind === "restored" && !latest.current.dirty) {
          latest.current.restore(result.values);
          setNotice(result.values.needsFile ? messages.supplierAgreement.reselectFile : messages.supplierAgreement.restored);
        }
        if (result.kind === "conflict") { stopped.current = true; setNotice(messages.supplierAgreement.localConflict); }
        if (result.kind === "unavailable") setNotice(messages.supplierAgreement.localUnavailable);
        setKey(storageKey);
      } catch { if (live) setNotice(messages.supplierAgreement.localUnavailable); }
    }
    void restore();
    return () => { live = false; };
  }, [allowed, supplierId, agreementId, baseVersion]);
  useEffect(() => {
    if (!key || !dirty || !allowed || stopped.current) return;
    const timer = setTimeout(() => {
      if (stopped.current) return;
      try {
        if (!writeAgreementDraft(sessionStorage, key, baseVersion, values)) setNotice(messages.supplierAgreement.localUnavailable);
      } catch { setNotice(messages.supplierAgreement.localUnavailable); }
    }, 300);
    return () => clearTimeout(timer);
  }, [key, dirty, allowed, baseVersion, values]);
  useEffect(() => {
    if (allowed || !key) return;
    stopped.current = true;
    try { sessionStorage.removeItem(key); } catch { setNotice(messages.supplierAgreement.localUnavailable); }
  }, [allowed, key]);
  function clear() {
    stopped.current = true;
    try { if (key) sessionStorage.removeItem(key); } catch { setNotice(messages.supplierAgreement.localUnavailable); }
  }
  return { notice, clear };
}
