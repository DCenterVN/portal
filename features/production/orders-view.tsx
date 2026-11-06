"use client";

import { ErrorState } from "@/components/patterns/empty-state";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/patterns/status-badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PageShell } from "@/components/ui/page";
import { PageHeading } from "@/components/patterns/page-heading";
import type { ProductionOrder } from "@/lib/api/production";
import { useProductionOrders } from "./use-production-orders";

interface OrdersViewProps {
  initialOrders?: ProductionOrder[];
}

export function OrdersView({ initialOrders }: OrdersViewProps) {
  const { orders, listLoading, listError, reload, loadingId, canUpdate, primaryOrderId, handleAccept, handleAllocate, handleStart, handleComplete } = useProductionOrders(initialOrders);

  return (
    <PageShell>
      <PageHeading
        title="Điều hành Sản xuất & Chế biến (VT-09 .. VT-12)"
        description="Quy trình Make-to-Stock: Tiếp nhận → Phân bổ FEFO → Sơ chế & Nấu → Đóng gói & Cấp đông"
      />

      {listError ? <ErrorState title={listError} onRetry={reload} className="mb-4" /> : <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Mã lệnh</TableHead>
                <TableHead>Số lượng kế hoạch</TableHead>
                <TableHead>SL Thực tế</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead className="text-right">Tiến độ quy trình</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-6 text-center text-muted-foreground">
                    {listLoading ? "Đang tải lệnh sản xuất…" : "Chưa có lệnh sản xuất nào được chuyển giao từ Chuyên gia dinh dưỡng (VT-21)"}
                  </TableCell>
                </TableRow>
              ) : (
                orders.map((o) => (
                  <TableRow key={o.id}>
                    <TableCell className="font-mono font-medium">{o.order_code}</TableCell>
                    <TableCell>{o.planned_quantity} {o.uom}</TableCell>
                    <TableCell>{o.actual_output_quantity > 0 ? `${o.actual_output_quantity} ${o.uom}` : "—"}</TableCell>
                    <TableCell>
                      <StatusBadge tone={
                          o.status === "QC_PASSED"
                            ? "success"
                            : o.status === "COMPLETED" || o.status === "IN_PROGRESS"
                            ? "neutral"
                            : o.status === "QC_FAILED" || o.status === "FAILED"
                            ? "danger"
                            : "neutral"
                        }
                      >
                        {o.status}
                      </StatusBadge>
                    </TableCell>
                    <TableCell className="text-right">
                      {o.status === "HANDED_OFF" && canUpdate && (
                        <Button
                          size="sm"
                          variant={o.id === primaryOrderId ? "default" : "outline"}
                          disabled={loadingId === o.id}
                          onClick={() => handleAccept(o.id)}
                        >
                          Tiếp nhận (VT-09)
                        </Button>
                      )}
                      {o.status === "ACCEPTED" && canUpdate && (
                        <Button
                          size="sm"
                          variant={o.id === primaryOrderId ? "default" : "outline"}
                          disabled={loadingId === o.id}
                          onClick={() => handleAllocate(o.id)}
                        >
                          Phân bổ FEFO
                        </Button>
                      )}
                      {o.status === "ALLOCATED" && canUpdate && (
                        <Button
                          size="sm"
                          variant={o.id === primaryOrderId ? "default" : "outline"}
                          disabled={loadingId === o.id}
                          onClick={() => handleStart(o.id)}
                        >
                          Bắt đầu nấu (VT-10/11)
                        </Button>
                      )}
                      {o.status === "IN_PROGRESS" && canUpdate && (
                        <Button
                          size="sm"
                          variant={o.id === primaryOrderId ? "default" : "outline"}
                          disabled={loadingId === o.id}
                          onClick={() => handleComplete(o.id, o.planned_quantity)}
                        >
                          Đóng gói & Cấp đông (VT-12)
                        </Button>
                      )}
                      {o.status === "COMPLETED" && (
                        <StatusBadge tone="warning">Chờ QC nghiệm thu (VT-13)</StatusBadge>
                      )}
                      {o.status === "QC_PASSED" && (
                        <StatusBadge tone="success">QC Đạt — Sẵn sàng lên kệ</StatusBadge>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>}
    </PageShell>
  );
}
