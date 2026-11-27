"use client";

import Link from "next/link";
import { OrderDetails } from "@/components/order-details";
import { PageShell } from "@/components/ui/page";
import { PageHeading } from "@/components/patterns/page-heading";
import { EmptyState, ErrorState, LoadingState } from "@/components/patterns/empty-state";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { StatusBadge, statusTone } from "@/components/patterns/status-badge";
import { TablePager } from "@/components/patterns/table-pager";
import { Button, buttonVariants } from "@/components/ui/button";
import { formatVND } from "@/lib/format";
import { formatDate } from "@/lib/format-date";
import { useAccess } from "@/lib/access-boundary";
import type { StaffOrder } from "@/lib/api/staff-orders";
import { availableActions, confirmBlocked, holdBlockedReason, orderStatuses, paymentStatusLabels, refundNotice, reservationLabels, type OrderAction } from "./order-actions";
import { useSalesOrders } from "./use-sales-orders";
import { OrderDialog } from "./order-dialog";
import { SalesFlowBar } from "./sales-flow-bar";

const paymentLabels: Record<string, string> = { COD: "COD", BANK_TRANSFER: "Chuyển khoản", CASH: "Tiền mặt" };
function Status({ status }: { status: string }) {
  return <StatusBadge tone={statusTone(status)}>{orderStatuses[status] ?? "Chưa rõ trạng thái"}</StatusBadge>;
}
export function SalesOrderButtons({ order, can, busy, act, userId, roles }: { userId?: string; roles?: readonly string[]; order: StaffOrder; can: (permission: string) => boolean; busy: boolean; act: (order: StaffOrder, action: OrderAction) => void }) {
  const actions = availableActions(order, can, userId, roles);
  const blocked = actions.some(action => action.path === "confirm") && confirmBlocked(order);
  return <div className="space-y-2">
    <div className="flex flex-wrap gap-2">{actions.map(action => <Button key={action.path} variant={action.path === "cancel" ? "destructive" : "outline"} disabled={busy || (action.path === "confirm" && blocked)} onClick={() => act(order, action.path)}>{busy ? "Đang xử lý…" : action.label}</Button>)}</div>
    {blocked && <p role="status" className="text-sm text-muted-foreground">{holdBlockedReason}</p>}
  </div>;
}
export function SalesOrdersView({ initialOrders }: { initialOrders?: StaffOrder[] }) {
  const { scope, can } = useAccess();
  if (!can("sales:order:read")) return <ErrorState denied title="Bạn không có quyền xem đơn hàng." />;
  return <OrdersContent key={`${scope?.orgId}:${scope?.branchId}`} initialOrders={initialOrders} />;
}
function OrdersContent({ initialOrders }: { initialOrders?: StaffOrder[] }) {
  const state = useSalesOrders(initialOrders);
  const { list, orders, filter, setFilter, order, setSelected, detail, provinces, communes, pending, busy, can, act } = state;
  const province = provinces.data?.find(item => item.code === order?.province_code)?.name;
  const commune = communes.data?.find(item => item.code === order?.commune_code)?.name;
  return <PageShell>
    <PageHeading title="Đơn hàng" description="Xác nhận, đóng gói và theo dõi giao hàng của chi nhánh đang làm việc." actions={<Link className={buttonVariants({ size: "sm", variant: "outline" })} href="/products">Mở cửa hàng khách</Link>} />
    <SalesFlowBar current="orders" />
    <div className="mb-4"><Select value={filter} onValueChange={setFilter}>
      <SelectTrigger aria-label="Lọc trạng thái" className="w-full sm:w-64"><SelectValue /></SelectTrigger>
      <SelectContent><SelectItem value="ALL">Tất cả trạng thái</SelectItem>
        {Object.entries(orderStatuses).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}
      </SelectContent>
    </Select></div>
    {list.error ? <ErrorState title={list.error} onRetry={list.reload} /> : list.loading ? <LoadingState title="Đang tải đơn hàng…" /> : orders.length === 0 ? <EmptyState title="Chưa có đơn hàng phù hợp với trạng thái đã chọn." onRetry={list.reload} /> :
      <Card className="gap-0 overflow-hidden py-0"><CardContent className="p-0"><Table>
        <TableHeader><TableRow>
          <TableHead>Mã đơn</TableHead><TableHead>Khách / Người nhận</TableHead><TableHead>SĐT</TableHead>
          <TableHead className="text-right">Tổng tiền</TableHead><TableHead>Thanh toán</TableHead><TableHead>Trạng thái</TableHead><TableHead>Ngày tạo</TableHead>
        </TableRow></TableHeader>
        <TableBody>{orders.map(item => <TableRow key={item.id} className="cursor-pointer" onClick={() => setSelected(item)}>
          <TableCell><Button variant="link" onClick={event => { event.stopPropagation(); setSelected(item); }}>{item.order_code || "Xem đơn hàng"}</Button></TableCell>
          <TableCell>{item.recipient_name || "Khách vãng lai"}</TableCell><TableCell>{item.recipient_phone || "Chưa có SĐT"}</TableCell>
          <TableCell className="text-right tabular-nums">{formatVND(item.total_vnd)}</TableCell><TableCell>{paymentLabels[item.payment_method ?? ""] || "API chưa cung cấp"}</TableCell>
          <TableCell><Status status={item.status} /></TableCell><TableCell>{formatDate(item.created_at)}</TableCell>
        </TableRow>)}</TableBody>
      </Table></CardContent></Card>}
    <TablePager label="Phân trang đơn hàng" busy={list.loading} status={`Trang ${list.page}`} hasPrevious={list.hasPrevious} onPrevious={list.previous} hasNext={list.hasNext} onNext={list.next} />
    <Sheet open={!!order && !pending} onOpenChange={open => { if (!open && !busy) setSelected(null); }}>
      <SheetContent className="overflow-y-auto">
        <SheetHeader><SheetTitle>Đơn {order?.order_code || "đã chọn"}</SheetTitle><SheetDescription>Người nhận, món đã đặt và tiến độ giao hàng.</SheetDescription></SheetHeader>
        {order && <div className="space-y-6 px-4 pb-6">
          {detail.error ? <ErrorState title="Không tải được chi tiết đơn" onRetry={() => void detail.mutate()} /> : detail.isLoading ? <LoadingState title="Đang tải chi tiết…" /> : <>
            <div className="flex flex-wrap items-center gap-2">
              <Status status={order.status} />
              {order.payment_status && <StatusBadge tone={order.payment_status === "SUCCESS" ? "success" : order.payment_status === "FAILED" ? "danger" : "warning"}>{paymentStatusLabels[order.payment_status]}</StatusBadge>}
              {order.reservation_state && <StatusBadge tone={statusTone(order.reservation_state)}>{reservationLabels[order.reservation_state] ?? "Chưa rõ tình trạng giữ hàng"}</StatusBadge>}
            </div>
            <dl className="space-y-2 text-sm">
              <dt className="text-muted-foreground">Người nhận</dt><dd>{order.recipient_name || "Khách vãng lai"}</dd>
              <dt className="text-muted-foreground">Số điện thoại</dt><dd>{order.recipient_phone || "Chưa có SĐT"}</dd>
              <dt className="text-muted-foreground">Địa chỉ</dt><dd>{order.delivery_address || "Nhận tại quầy"}</dd>
              <dd>{[commune, province].filter(Boolean).join(", ")}</dd>
              <dt className="text-muted-foreground">Thanh toán</dt><dd>{paymentLabels[order.payment_method ?? ""] || "API chưa cung cấp phương thức thanh toán"}</dd>
              <dt className="text-muted-foreground">Tổng tiền</dt><dd>{formatVND(order.total_vnd)}</dd>
              {order.delivery_note && <><dt className="text-muted-foreground">Ghi chú giao hàng</dt><dd>{order.delivery_note}</dd></>}
            </dl>
            {(provinces.error || communes.error) && <ErrorState title="Không tải được tên tỉnh/xã" onRetry={() => { void provinces.mutate(); void communes.mutate(); }} />}
            {refundNotice(order) && <p role="status" className="text-sm text-muted-foreground">{refundNotice(order)}</p>}
            <OrderDetails order={order} />
            <SalesOrderButtons userId={state.userId} roles={state.roles} order={order} can={can} busy={busy} act={act} />
            {state.error && <p role="alert" className="text-sm text-destructive">{state.error}</p>}
          </>}
        </div>}
      </SheetContent>
    </Sheet>
    <OrderDialog state={state} />
  </PageShell>;
}
