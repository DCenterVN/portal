"use client";

import { useEvidenceUrl } from "./use-transfer-detail";

function Photo({ transfer, media, index }: { transfer: string; media: string; index: number }) {
  const { data, error } = useEvidenceUrl(transfer, media);
  if (error) return <p className="text-xs text-muted-foreground">Không mở được ảnh {index + 1}.</p>;
  if (!data) return <div role="status" aria-label={`Đang tải ảnh ${index + 1}`} className="size-32 animate-pulse rounded-lg bg-muted" />;
  return <a href={data} target="_blank" rel="noreferrer"><img src={data} alt={`Ảnh bằng chứng ${index + 1}`} className="size-32 rounded-lg border border-border object-cover" /></a>;
}

export function TransferEvidence({ transfer, media }: { transfer: string; media: string[] }) {
  if (!media.length) return <p className="text-sm text-muted-foreground">Phiếu này chưa có ảnh.</p>;
  return <div className="flex flex-wrap gap-3">{media.map((ref, index) => <Photo key={ref} transfer={transfer} media={ref} index={index} />)}</div>;
}
