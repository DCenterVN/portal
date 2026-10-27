"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { z } from "zod";
import { useTranslations } from "next-intl";
import { useAccess } from "@/lib/access-boundary";
import { getMaterialCategories } from "@/lib/api/material-categories";
import type { MaterialCategory } from "@/lib/api/inventory/types";
import { createSupplier, updateSupplier, type Supplier, type SupplierInput } from "@/lib/api/suppliers";
import { fileSHA256, uploadDocument } from "@/lib/api/agreement-documents";
import { presignSupplierPhoto, finalizeSupplierPhoto, validSupplierPhoto } from "@/lib/api/supplier-photo";

export type SupplierSaveState = {
  key: string; presignKey: string; finalizeKey: string; saved?: Supplier;
  upload?: Awaited<ReturnType<typeof presignSupplierPhoto>>; uploaded?: boolean; sha256?: string;
};
type SupplierSaveOptions = { state: SupplierSaveState; input: SupplierInput; supplier?: Supplier; file?: File | null };
export async function saveSupplierWithPhoto({ state, input, supplier, file }: SupplierSaveOptions): Promise<Supplier> {
  if (!state.saved) {
    const { code: _code, ...patch } = input;
    state.saved = supplier ? await updateSupplier(supplier.id, patch, state.key) : await createSupplier(input, state.key);
  }
  if (!file) return state.saved;
  state.sha256 ??= await fileSHA256(file);
  state.upload ??= await presignSupplierPhoto(state.saved.id, file, state.sha256, state.presignKey);
  if (!state.uploaded) { await uploadDocument(state.upload, file); state.uploaded = true; }
  const { upload_id: _upload, ...photo } = await finalizeSupplierPhoto(state.saved.id, state.upload.upload_id, state.finalizeKey);
  return { ...state.saved, photo };
}

export type SupplierFormValues = {
  code: string; name: string; tax: string;
  line: string; ward: string; province: string;
  contactName: string; phone: string; email: string; note: string;
};
export type SupplierFormField = keyof SupplierFormValues;
export type SupplierFormErrors = Partial<Record<SupplierFormField, "missingCode" | "missingName" | "phoneError" | "emailError" | "lengthError">>;
export type SupplierFormOptions = { supplier?: Supplier; onClose: () => void; onSaved: (supplier: Supplier) => void };
const supplierFormFields: SupplierFormField[] = ["code", "name", "tax", "line", "ward", "province", "contactName", "phone", "email", "note"];
export const supplierFieldLimits: Record<SupplierFormField, number> = {
  code: 64, name: 200, tax: 32, line: 300, ward: 120, province: 120,
  contactName: 150, phone: 20, email: 254, note: 2000,
};

export function supplierFormValues(supplier?: Supplier): SupplierFormValues {
  return {
    code: supplier?.code ?? "", name: supplier?.name ?? "", tax: supplier?.tax_code ?? "",
    line: supplier?.address?.line ?? "", ward: supplier?.address?.ward ?? "", province: supplier?.address?.province ?? "",
    contactName: supplier?.contact_name ?? "", phone: supplier?.contact_phone ?? "",
    email: supplier?.contact_email ?? "", note: supplier?.note ?? "",
  };
}

export function supplierFormErrors(values: SupplierFormValues): SupplierFormErrors {
  const errors: SupplierFormErrors = {};
  for (const field of supplierFormFields) {
    if (Array.from(values[field].trim()).length > supplierFieldLimits[field]) errors[field] = "lengthError";
  }
  if (!values.code.trim()) errors.code = "missingCode";
  if (!values.name.trim()) errors.name = "missingName";
  if (!/^(|0[0-9]{9}|\+84[0-9]{9})$/.test(values.phone.trim())) errors.phone = "phoneError";
  if (values.email.trim() && !z.string().email().safeParse(values.email.trim()).success) errors.email = "emailError";
  return errors;
}

export function supplierFormInput(values: SupplierFormValues, selected: string[], groupsChanged: boolean): SupplierInput {
  return {
    code: values.code.trim(), name: values.name.trim(), tax_code: values.tax.trim(),
    address: { line: values.line.trim(), ward: values.ward.trim(), province: values.province.trim() },
    contact_name: values.contactName.trim(), contact_phone: values.phone.trim(), contact_email: values.email.trim(), note: values.note.trim(),
    ...(groupsChanged ? { material_category_codes: selected } : {}),
  };
}

export function categoryCheckState(selected: string[], codes: string[]): boolean | "indeterminate" {
  const count = codes.filter(code => selected.includes(code)).length;
  return count === 0 ? false : count === codes.length ? true : "indeterminate";
}

export function toggleCategorySelection(selected: string[], codes: string[], checked: boolean): string[] {
  return checked ? [...new Set([...selected, ...codes])] : selected.filter(code => !codes.includes(code));
}

export function useSupplierCategories(enabled = true) {
  const [categories, setCategories] = useState<MaterialCategory[] | null>(null);
  const [lookupError, setLookupError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    if (!enabled) return;
    let live = true;
    getMaterialCategories().then(items => { if (live) { setCategories(items); setLookupError(false); } }).catch(() => { if (live) setLookupError(true); });
    return () => { live = false; };
  }, [enabled, attempt]);
  return { categories, lookupError, retry: () => { setLookupError(false); setAttempt(value => value + 1); } };
}

export function useSupplierForm({ supplier, onClose, onSaved }: SupplierFormOptions) {
  const t = useTranslations("supplierForm");
  const { can } = useAccess();
  const allowed = can(supplier ? "inventory:supplier:update" : "inventory:supplier:create");
  const lookup = useSupplierCategories(allowed);
  const [values, setValues] = useState(() => supplierFormValues(supplier));
  const [selected, setSelected] = useState(supplier?.material_category_codes ?? []);
  const [groupsChanged, setGroupsChanged] = useState(!supplier);
  const [touched, setTouched] = useState<Partial<Record<SupplierFormField, boolean>>>({});
  const [dirty, setDirty] = useState(false);
  const [discard, setDiscard] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState("");
  const [photoError, setPhotoError] = useState("");
  const [photoPending, setPhotoPending] = useState(false);
  const photoAllowed = can("inventory:supplier:update");
  const submitting = useRef(false);
  const command = useRef({ body: "", key: "" });
  const saveState = useRef<SupplierSaveState>({ key: "", presignKey: "", finalizeKey: "" });
  useEffect(() => {
    if (!photo) { setPhotoPreview(""); return; }
    const url = URL.createObjectURL(photo);
    setPhotoPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [photo]);
  const errors = supplierFormErrors(values);
  const leaves = lookup.categories?.flatMap(parent => parent.children.map(child => child.code)) ?? [];
  const groupsValid = !groupsChanged || selected.every(code => leaves.includes(code));
  const valid = allowed && !photoError && Object.keys(errors).length === 0 && lookup.categories !== null && !lookup.lookupError && groupsValid;

  function choosePhoto(file: File | null) {
    if (busy || !photoAllowed) return;
    if (file && !validSupplierPhoto(file)) {
      setPhotoError(t(file.size < 1 || file.size > 5242880 ? "photoSizeError" : "photoTypeError"));
      return;
    }
    setPhoto(file); setPhotoError(""); setDirty(true);
    saveState.current = { key: command.current.key, saved: saveState.current.saved, presignKey: crypto.randomUUID(), finalizeKey: crypto.randomUUID() };
  }

  function change(field: SupplierFormField, value: string) {
    setValues(current => ({ ...current, [field]: value }));
    setDirty(true);
  }
  function select(codes: string[]) {
    setSelected(codes); setGroupsChanged(true); setDirty(true);
  }
  function fieldError(field: SupplierFormField) {
    const issue = touched[field] ? errors[field] : undefined;
    return issue ? t(issue, { count: supplierFieldLimits[field] }) : undefined;
  }
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!valid || submitting.current) return;
    const input = supplierFormInput(values, selected, groupsChanged);
    const encoded = JSON.stringify(input);
    if (!saveState.current.saved && command.current.body !== encoded) {
      command.current = { body: encoded, key: crypto.randomUUID() };
      saveState.current = { key: command.current.key, presignKey: crypto.randomUUID(), finalizeKey: crypto.randomUUID() };
    }
    submitting.current = true; setBusy(true); setError("");
    try {
      const saved = await saveSupplierWithPhoto({ state: saveState.current, input, supplier, file: photo });
      onSaved(saved);
    } catch (cause) {
      if (saveState.current.saved && photo) { setPhotoPending(true); setError(t("photoPending")); }
      else setError(cause instanceof Error ? cause.message : t("saveError"));
    }
    finally { submitting.current = false; setBusy(false); }
  }
  const missing = errors.code || errors.name ? t("required") : Object.keys(errors).length ? t("fixErrors") : t("waitGroups");
  return {
    ...lookup, t, allowed, values, change, selected, select, fieldError,
    touch: (field: SupplierFormField) => setTouched(current => ({ ...current, [field]: true })),
    dirty, discard, setDiscard, error, busy, valid, missing, submit,
    photo, photoPreview, photoError, photoPending, photoAllowed, choosePhoto,
    close: () => { if (!busy) { if (dirty) setDiscard(true); else onClose(); } },
    legacy: Boolean(supplier && (supplier.category_migration_required ?? supplier.material_categories.length > 0) && !groupsChanged),
  };
}
