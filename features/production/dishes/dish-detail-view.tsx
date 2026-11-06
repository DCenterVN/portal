import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { slotLabels } from "@/lib/dishes/types";
import type { DishDetail, Variant } from "@/lib/dishes/dish-detail";
import { journeyLabels } from "./dish-list-view";
const person = (name: string) => name.replace(/[0-9a-f]{8}-[0-9a-f-]{27,}/gi, "Thành viên chi nhánh");
export function DishDetailView(props: { detail: DishDetail; selected: string; variant: Variant | undefined; busy: boolean; canCreate: boolean; onSelect: (id: string) => void; onBack: () => void; onCopy: () => void; onVariant: () => void; onRevision: () => void; onDraft: (id: string) => void; children: ReactNode }) {
  return <div className="space-y-6"><Button variant="ghost" onClick={props.onBack}>Về danh sách món</Button><Card><CardContent className="space-y-4 pt-6"><h2>{props.detail.product.name}</h2><p>{props.detail.product.category_name || "Danh mục món"}</p>
    <Tabs value={props.selected} onValueChange={props.onSelect}>
      <TabsList aria-label="Biến thể món" className="h-auto flex-wrap">{props.detail.variants.map(v => <TabsTrigger key={v.set_ref} value={v.set_ref}>{v.variant_label} · {journeyLabels[v.journey]}</TabsTrigger>)}</TabsList>
      <TabsContent value={props.selected}>{props.variant && <div className="space-y-4"><Badge>{journeyLabels[props.variant.journey]}</Badge>{props.children}
        <section aria-label="Gia vị món"><h3>Gia vị</h3>{props.variant.seasonings.map(line => <p key={line.slot}>{slotLabels[line.slot]} · {line.package_name} · {line.removable ? "Cho bỏ" : "Bắt buộc"}</p>)}</section>
        {props.canCreate && <div className="flex flex-wrap gap-3"><Button variant="outline" disabled={props.busy} onClick={props.onCopy}>Nhân bản</Button><Button variant="outline" disabled={props.busy} onClick={props.onVariant}>Tạo biến thể</Button>{props.variant.journey !== "SELLING" && <Button disabled={props.busy} onClick={props.onRevision}>Tạo bản sửa</Button>}</div>}
      </div>}</TabsContent>
    </Tabs>
  </CardContent></Card><Card><CardContent className="space-y-3 pt-6"><h2>Nháp đang mở của món</h2>{props.detail.open_drafts.length ? props.detail.open_drafts.map(row => <div key={row.id} className="flex flex-wrap items-center justify-between gap-3"><p>{row.title || "Món chưa đặt tên"} · {person(row.updated_by)}</p><Button variant="outline" onClick={() => props.onDraft(row.id)}>Tiếp tục nháp</Button></div>) : <p>Chưa có nháp đang mở.</p>}</CardContent></Card>
    <Card><CardContent className="space-y-3 pt-6"><h2>Lịch sử bản sửa</h2>{props.detail.revision_history.length ? props.detail.revision_history.map(row => <p key={row.id}>Ngày hoàn tất: {row.completed_at ? new Date(row.completed_at).toLocaleString("vi-VN") : "Chưa có ngày"} · {person(row.updated_by)} · {row.reason}</p>) : <p>Chưa có bản sửa đã hoàn tất.</p>}</CardContent></Card>
  </div>;
}
