"use client";

import { useEffect, useRef, useState } from "react";
import { validContractFile } from "@/lib/api/agreement-documents";
import { fileSHA256, uploadReceiptEvidence, presignReceiptEvidence, finalizeReceiptEvidence, type EvidencePurpose } from "@/lib/api/goods-receipt-receive";
import { FetchError } from "@/lib/fetcher";

export type ReceiptEvidence = { media_ref: string; sha256: string; file: File };
type Upload = { file: File; key: string; finalizeKey: string; target?: Awaited<ReturnType<typeof presignReceiptEvidence>>; uploaded: boolean };
type Config = {
  receipt: string; line: string; attempt: string; purpose: EvidencePurpose;
  disabled: boolean; hashes: string[]; onChange: (evidence?: ReceiptEvidence) => void;
};

export function useReceiptEvidenceUpload(props: Config) {
  const [file, setFile] = useState<File>();
  const [preview, setPreview] = useState("");
  const [error, setError] = useState("");
  const [reload, setReload] = useState(false);
  const [busy, setBusy] = useState(false);
  const command = useRef<Upload | null>(null);
  const inFlight = useRef(false);
  useEffect(() => {
    if (!file || !file.type.startsWith("image/")) { setPreview(""); return; }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);
  async function choose(next: File) {
    if (props.disabled || inFlight.current) return;
    setFile(next); setError(""); setReload(false); props.onChange();
    if (!validContractFile(next) || (next.type === "application/pdf" && props.purpose !== "DELIVERY_DOCUMENT")) {
      setError("Chọn đúng loại tệp, dung lượng từ 1 byte đến 5 MiB."); return;
    }
    if (command.current?.file !== next) command.current = { file: next, key: crypto.randomUUID(), finalizeKey: crypto.randomUUID(), uploaded: false };
    const upload = command.current;
    inFlight.current = true; setBusy(true);
    try {
      const sha256 = await fileSHA256(next);
      if (props.hashes.includes(sha256)) throw new Error("Ảnh trùng với ô khác của lần nhận này. Chọn tệp khác.");
      upload.target ??= await presignReceiptEvidence(props.receipt, { goods_receipt_line_id: props.line, receive_attempt_ref: props.attempt, purpose: props.purpose, content_type: next.type, size_bytes: next.size, sha256 }, upload.key);
      if (!upload.uploaded) { await uploadReceiptEvidence(upload.target, next); upload.uploaded = true; }
      const result = await finalizeReceiptEvidence(props.receipt, upload.target.upload_id, upload.finalizeKey);
      props.onChange({ media_ref: result.media_ref, sha256: result.sha256, file: next });
    } catch (cause) {
      setReload(cause instanceof FetchError && cause.status === 409 && cause.code === "state_conflict");
      setError(cause instanceof FetchError && cause.status === 403 ? "Bạn cần quyền cập nhật phiếu nhập" : cause instanceof Error ? cause.message : "Không tải được tệp. Hãy thử lại.");
    } finally { inFlight.current = false; setBusy(false); }
  }
  const resetCommand = () => { command.current = null; };
  return { file, preview, error, reload, busy, choose, resetCommand };
}
