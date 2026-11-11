import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatVND } from "@/lib/format";
import { formatDateTime } from "@/lib/format-date";
import { orderStatuses, type OrderDetails } from "@/lib/order-detail";

export function OrderDetails({ order }: { order: Pick<OrderDetails, "items" | "state_history"> }) {
  return <>
    <section className="space-y-2"><h2 className="font-medium">Món đã đặt</h2>
      {order.items?.length ? <Table>
        <TableHeader><TableRow><TableHead>Tên món</TableHead><TableHead>Phần</TableHead><TableHead>SL</TableHead><TableHead>Đơn giá</TableHead><TableHead>Thành tiền</TableHead></TableRow></TableHeader>
        <TableBody>{order.items.map((item, index) => <TableRow key={index}>
          <TableCell>{item.sku_name}</TableCell><TableCell>{item.variant_label || "—"}</TableCell><TableCell>{item.quantity}</TableCell>
          <TableCell className="tabular-nums">{formatVND(item.unit_price_vnd)}</TableCell><TableCell className="tabular-nums">{formatVND(item.line_total_vnd)}</TableCell>
        </TableRow>)}</TableBody>
      </Table> : <p className="text-sm text-muted-foreground">Chưa có thông tin món đã đặt.</p>}
    </section>
    {!!order.state_history?.length && <section className="space-y-2"><h2 className="font-medium">Lịch sử trạng thái</h2>
      {order.state_history.map((entry, index) => <p key={index} className="text-sm">{formatDateTime(entry.created_at)} · {entry.from_state ? `${orderStatuses[entry.from_state] ?? "Chưa rõ trạng thái"} → ` : ""}{orderStatuses[entry.to_state] ?? "Chưa rõ trạng thái"}</p>)}
    </section>}
  </>;
}
