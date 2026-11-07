"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { fileSHA256, finalizeTransferEvidence, presignTransferEvidence, uploadTransferEvidence, validContractFile } from "@/lib/api/stock-transfers";

export const MAX_PHOTOS = 10;
type Photo = { id: string; file: File; url: string; media?: string };
const IMAGE = ["image/jpeg", "image/png", "image/webp"];

export function useTransferEvidence(transfer: string) {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [error, setError] = useState("");
  const current = useRef(photos);
  current.current = photos;
  useEffect(() => () => current.current.forEach(photo => URL.revokeObjectURL(photo.url)), []);

  const add = useCallback((files: FileList | File[]) => {
    const picked = [...files];
    const bad = picked.find(file => !validContractFile(file) || !IMAGE.includes(file.type));
    if (bad) { setError("Chọn ảnh JPEG, PNG hoặc WebP, dung lượng tối đa 5 MiB."); return; }
    if (current.current.length + picked.length > MAX_PHOTOS) { setError(`Mỗi phiếu tối đa ${MAX_PHOTOS} ảnh.`); return; }
    setError("");
    setPhotos(items => [...items, ...picked.map(file => ({ id: crypto.randomUUID(), file, url: URL.createObjectURL(file) }))]);
  }, []);

  const remove = useCallback((id: string) => {
    setPhotos(items => {
      items.filter(photo => photo.id === id).forEach(photo => URL.revokeObjectURL(photo.url));
      return items.filter(photo => photo.id !== id);
    });
  }, []);

  async function uploadAll(): Promise<string[]> {
    const refs: string[] = [];
    for (const photo of current.current) {
      if (!photo.media) {
        const sha256 = await fileSHA256(photo.file);
        const target = await presignTransferEvidence(transfer, photo.file, sha256);
        await uploadTransferEvidence(target, photo.file);
        photo.media = await finalizeTransferEvidence(transfer, target.upload_id);
      }
      refs.push(photo.media);
    }
    return refs;
  }
  return { photos, error, add, remove, uploadAll, setError };
}
