"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { presignAvatar, finalizeAvatar, deleteAvatar } from "@/lib/api/account-client";
import { validateAvatar, uploadAvatar } from "@/lib/api/account-avatar";
import { useAccountAction } from "./use-account-action";

export function useAccountAvatar(onSaved: () => Promise<void>) {
  const t = useTranslations("account");
  const action = useAccountAction();
  const selection = useRef(0);
  const uploading = useRef(false);
  const [validating, setValidating] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [removing, setRemoving] = useState(false);
  useEffect(createPreview, [file]);
  function createPreview() {
    if (!file) { setPreview(""); return; }
    const url = URL.createObjectURL(file);
    setPreview(url);
    function dispose() { URL.revokeObjectURL(url); }
    return dispose;
  }
  async function selectFile(next?: File) {
    if (!next || action.busy || uploading.current) return;
    uploading.current = true;
    setValidating(true);
    const version = ++selection.current;
    try {
      await validateAvatar(next);
      if (version !== selection.current) return;
      action.setError("");
      setFile(next);
      const saved = await action.run(() => saveUpload(next));
      if (!saved) setFile(null);
    } catch { if (version === selection.current) action.setError(t("invalidAvatar")); }
    finally { uploading.current = false; setValidating(false); }
  }
  function cancel() { selection.current++; setFile(null); action.setError(""); }
  async function saveUpload(next = file) {
    if (!next) return;
    const grant = await presignAvatar({ file_name: next.name, content_type: next.type, file_size: next.size });
    await uploadAvatar(next, grant);
    await finalizeAvatar({ upload_id: grant.upload_id });
    setFile(null);
    await onSaved();
  }
  async function removeAvatar() {
    await deleteAvatar();
    cancel();
    setRemoving(false);
    await onSaved();
  }
  async function remove() { await action.run(removeAvatar); }
  return { file, preview, selectFile, cancel, remove, removing, setRemoving, busy: action.busy || validating, error: action.error };
}
