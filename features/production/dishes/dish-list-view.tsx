"use client";

import { DishSemiPicker } from "./dish-semi-picker";
import type { SemiFinishedItem, SemiSlot } from "@/lib/api/semi-finished";

import type { Route } from "next";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Plus, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmptyState, LoadingState } from "@/components/patterns/empty-state";
import { InlineAlert } from "@/components/patterns/inline-alert";
import { journeyLabels, type DishListRow, type DraftRow, type Journey } from "@/lib/dishes/types";
import { matchesName } from "../materials-catalog";
import { NumberedPager } from "../materials-view-parts";
import { DraftList } from "./dish-draft-list";

export { journeyLabels };

const ALL_STATUS = "__all__";

function DishStatusBadge({ counts }: { counts: Record<Journey, number> }) {
  if (counts.SELLING > 0) return <Badge variant="default" className="absolute top-2 left-2">{journeyLabels.SELLING}</Badge>;
  if (counts.DONE > 0) return <Badge variant="secondary" className="absolute top-2 left-2">{journeyLabels.DONE}</Badge>;
  if (counts.DRAFT > 0) return <Badge variant="outline" className="absolute top-2 left-2 bg-background/90">{journeyLabels.DRAFT}</Badge>;
  if (counts.STOPPED > 0) return <Badge variant="outline" className="absolute top-2 left-2 bg-background/90">{journeyLabels.STOPPED}</Badge>;
  return null;
}

function DishCard({ row }: { row: DishListRow }) {
  const [failed, setFailed] = useState(false);
  const imageUrl = row.product.image_urls?.[0];
  return <li>
    <Link href={`/production/dishes/${row.product.id}` as Route} className="group flex flex-col gap-2 rounded-lg text-left outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50">
      <div className="relative aspect-square w-full overflow-hidden rounded-lg bg-muted">
        {imageUrl && !failed
          ? <img src={imageUrl} alt={row.product.name} loading="lazy" onError={() => setFailed(true)} className="size-full object-cover" />
          : <div aria-hidden="true" className="flex size-full items-center justify-center bg-muted text-2xl font-medium text-muted-foreground">{row.product.name.trim().charAt(0).toUpperCase()}</div>}
        <DishStatusBadge counts={row.counts} />
      </div>
      <p className="line-clamp-2 text-left text-sm font-medium group-hover:underline">{row.product.name}</p>
      {row.variants.length > 0 && <p className="truncate text-left text-xs text-muted-foreground">{row.variants.map(v => v.variant_label).join(" · ")}</p>}
    </Link>
  </li>;
}

export function DishListView(props: {
  rows: DishListRow[];
  drafts: DraftRow[];
  draftNext: string | null;
  draftBusy: boolean;
  draftsLoading?: boolean;
  draftError?: string;
  initialTab?: "dishes" | "drafts" | "semi";
  semiItems?: SemiFinishedItem[];
  semiLoading?: boolean;
  semiError?: string;
  q: string;
  status: string;
  page: number;
  totalPages: number;
  busy: boolean;
  error: string;
  canCreate: boolean;
  onQ: (q: string) => void;
  onStatus: (status: string) => void;
  onPage: (page: number) => void;
  onTabChange?: (tab: "dishes" | "drafts" | "semi") => void;
  onCreate: () => void;
  onCreateSemi?: (defaultSlot?: SemiSlot) => void;
  onRetrySemi?: () => void;
  onMoreDrafts: () => void;
  onDiscardDraft?: (id: string) => Promise<void> | void;
  onRetry: () => void;
}) {
  const [tab, setTab] = useState<"dishes" | "drafts" | "semi">(props.initialTab ?? "dishes");
  const [draftQ, setDraftQ] = useState("");
  useEffect(() => {
    if (props.initialTab) setTab(props.initialTab);
  }, [props.initialTab]);
  const handleTabChange = (value: string) => {
    const next = value === "drafts" ? "drafts" : value === "semi" ? "semi" : "dishes";
    setTab(next);
    props.onTabChange?.(next);
  };
  const filteredDrafts = props.drafts.filter(draft => matchesName(draft.title || "", draftQ));
  return <Tabs value={tab} onValueChange={handleTabChange} className="gap-4" aria-busy={props.busy}>
    <div className="flex flex-wrap items-center gap-2">
      <TabsList aria-label="Chế độ xem món ăn">
        <TabsTrigger value="dishes">Món ăn</TabsTrigger>
        <TabsTrigger value="semi">Bán thành phẩm{props.semiItems?.length ? ` (${props.semiItems.length})` : ""}</TabsTrigger>
        <TabsTrigger value="drafts">
          Nháp đang soạn
          {(props.drafts.length > 0 || Boolean(props.draftNext)) && (
            <Badge variant="secondary" className="ml-1.5 px-1.5 py-0 text-xs font-normal tabular-nums">
              {props.draftNext ? `${props.drafts.length}+` : props.drafts.length}
            </Badge>
          )}
        </TabsTrigger>
      </TabsList>
      {tab !== "semi" && <InputGroup className="w-70 shrink-0"><InputGroupAddon><Search aria-hidden="true" /></InputGroupAddon><InputGroupInput aria-label={tab === "drafts" ? "Tìm nháp" : "Tìm món"} placeholder={tab === "drafts" ? "Tìm tên nháp…" : "Tìm tên món…"} value={tab === "drafts" ? draftQ : props.q} onChange={e => (tab === "drafts" ? setDraftQ(e.target.value) : props.onQ(e.target.value))} /></InputGroup>}
      {tab === "dishes" && <Select value={props.status || ALL_STATUS} onValueChange={value => props.onStatus(value === ALL_STATUS ? "" : value)}>
        <SelectTrigger aria-label="Trạng thái" className="w-48 shrink-0"><SelectValue /></SelectTrigger>
        <SelectContent position="popper" align="start">
          <SelectItem value={ALL_STATUS}>Tất cả trạng thái</SelectItem>
          <SelectItem value="DRAFT">Chưa hoàn tất</SelectItem>
          <SelectItem value="DONE">Đã hoàn tất</SelectItem>
          <SelectItem value="SELLING">Đang bán</SelectItem>
          <SelectItem value="STOPPED">Ngừng</SelectItem>
        </SelectContent>
      </Select>}
      {props.canCreate && (tab === "semi"
        ? <Button className="ml-auto shrink-0" disabled={props.busy} onClick={() => props.onCreateSemi?.("DO_CHUA")}><Plus data-icon="inline-start" aria-hidden="true" />Tạo bán thành phẩm</Button>
        : <Button className="ml-auto shrink-0" disabled={props.busy} onClick={props.onCreate}><Plus data-icon="inline-start" aria-hidden="true" />Tạo món</Button>)}
    </div>
    <TabsContent value="dishes" className="space-y-4">
      {props.busy
        ? <LoadingState title="Đang tải danh sách món…" />
        : props.error
          ? <InlineAlert>{props.error} <Button variant="outline" onClick={props.onRetry}>Thử lại</Button></InlineAlert>
          : !props.rows.length
            ? <EmptyState title="Chưa có món phù hợp" description="Tạo món mới hoặc đổi bộ lọc để xem món." />
            : <ul className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-6 animate-in fade-in duration-200 motion-reduce:animate-none">{props.rows.map(row => <DishCard key={row.product.id} row={row} />)}</ul>}
      {!props.busy && !props.error && <NumberedPager current={props.page} total={props.totalPages} onGo={props.onPage} />}
    </TabsContent>
    <TabsContent value="drafts" className="space-y-4">
      {props.draftError && <InlineAlert>{props.draftError}</InlineAlert>}
      {props.draftsLoading
        ? <LoadingState title="Đang tải nháp đang soạn…" />
        : !filteredDrafts.length && !props.draftNext
          ? <EmptyState title={draftQ.trim() ? "Không tìm thấy nháp phù hợp" : "Chưa có nháp đang soạn"} description={draftQ.trim() ? "Thử từ khoá khác hoặc xoá ô tìm kiếm." : "Mọi món đang tạo hoặc bản sửa dở sẽ lưu tại đây để mở tiếp."} />
          : <DraftList title="Nháp đang soạn" drafts={filteredDrafts} emptyText={draftQ.trim() ? "Không có nháp phù hợp trong trang đã tải — bấm Tải thêm để tìm tiếp." : "Bấm Tải thêm để xem các nháp còn lại."} hasMore={Boolean(props.draftNext)} busy={false} loading={props.draftBusy} fromDraftsTab onDiscard={props.canCreate ? props.onDiscardDraft : undefined} onMore={props.onMoreDrafts} />}
    </TabsContent>
    <TabsContent value="semi" className="mt-0">
      <DishSemiPicker
        items={props.semiItems ?? []}
        loading={props.semiLoading}
        error={props.semiError}
        canCreate={props.canCreate}
        onCreateNew={slot => props.onCreateSemi?.(slot)}
        onRetry={props.onRetrySemi}
      />
    </TabsContent>
  </Tabs>;
}
