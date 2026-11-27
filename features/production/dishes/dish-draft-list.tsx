"use client";

import type { Route } from "next";
import Link from "next/link";
import { useState } from "react";
import { Trash2 } from "lucide-react";
import { formatDateTime } from "@/lib/format-date";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/patterns/confirm-dialog";
import { Tip } from "@/components/patterns/tip";
import { draftKindLabels, type DraftKind, type DraftRow } from "@/lib/dishes/types";

export const person = (name: string) => name.replace(/[0-9a-f]{8}-[0-9a-f-]{27,}/gi, "Thành viên chi nhánh");

export function DraftList({ title = "Nháp đang soạn", drafts, emptyText, hasMore, busy, loading, fromDraftsTab, onDiscard, onMore }: {
  title?: string;
  drafts: DraftRow[];
  emptyText: string;
  hasMore?: boolean;
  busy?: boolean;
  loading?: boolean;
  fromDraftsTab?: boolean;
  onDiscard?: (id: string) => Promise<void> | void;
  onMore?: () => void;
}) {
  const [pending, setPending] = useState<DraftRow | null>(null);
  const [discarding, setDiscarding] = useState(false);
  return <>
    <Card className="gap-0 overflow-hidden py-0"><CardContent className="p-0">
      <h2 className="border-b bg-muted/40 px-4 py-2.5 text-sm font-semibold">{title}</h2>
      {!drafts.length
        ? <p className="px-4 py-4 text-sm text-muted-foreground">{emptyText}</p>
        : <div className="divide-y divide-border">{drafts.map(draft => <div key={draft.id} className="flex items-center gap-2 pr-2 hover:bg-muted/30">
          <Link href={(fromDraftsTab ? `/production/dishes/drafts/${draft.id}?from=drafts` : `/production/dishes/drafts/${draft.id}`) as Route} className="flex min-w-0 flex-1 flex-wrap items-center gap-2 px-4 py-2.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring">
            <Badge variant="outline" className="shrink-0 font-normal">{draftKindLabels[draft.kind as DraftKind] ?? draft.kind}</Badge>
            <span className="min-w-0 truncate font-medium">{draft.title || "Món chưa đặt tên"}</span>
            <span className="text-xs text-muted-foreground">{person(draft.updated_by)} · {formatDateTime(draft.updated_at)}</span>
          </Link>
          {onDiscard && <Tip label="Bỏ nháp"><Button type="button" variant="ghost" size="icon-sm" aria-label={`Bỏ nháp ${draft.title || "chưa đặt tên"}`} disabled={busy || discarding} onClick={() => setPending(draft)}><Trash2 className="text-destructive" aria-hidden="true" /></Button></Tip>}
        </div>)}</div>}
      {hasMore && onMore && <div className="border-t px-4 py-3"><Button type="button" variant="outline" size="sm" disabled={busy || loading} onClick={onMore}>{loading ? "Đang tải…" : "Tải thêm"}</Button></div>}
    </CardContent></Card>
    <ConfirmDialog
      open={Boolean(pending)}
      onOpenChange={open => { if (!open && !discarding) setPending(null); }}
      title="Bỏ nháp món?"
      description={pending?.title ? `Bỏ nháp "${pending.title}"? Nội dung nháp sẽ bị xoá.` : "Nội dung nháp này sẽ bị bỏ."}
      confirmLabel="Bỏ nháp"
      danger
      busy={discarding}
      onConfirm={async () => {
        if (!pending || !onDiscard) return;
        setDiscarding(true);
        try {
          await onDiscard(pending.id);
          setPending(null);
        } finally {
          setDiscarding(false);
        }
      }}
    />
  </>;
}
