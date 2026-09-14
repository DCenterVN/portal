"use client";

import React, { useEffect, useState } from "react";
import { Play, CheckSquare, Layers, Box, CheckCircle2, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/components/ui/toast";
import { PageShell, PageHeader } from "@/components/ui/page";
import {
  ProductionOrder,
  acceptOrder,
  allocateOrderLots,
  startOrder,
  completeOrder,
} from "@/lib/api/production";

interface OrdersViewProps {
  initialOrders: ProductionOrder[];
}

export function OrdersView({ initialOrders }: OrdersViewProps) {
  const { toast } = useToast();
  const [orders, setOrders] = useState<ProductionOrder[]>(initialOrders);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [startRole, setStartRole] = useState<"VT-10" | "VT-11">("VT-10");

  useEffect(() => {
    fetch("/api/auth/context", { cache: "no-store" })
      .then((response) => response.ok ? response.json() : Promise.reject(new Error("Không thể tải quyền")))
      .then((context: { active_context?: { branch_id?: string }; contexts?: Array<{ branch_id: string; roles: string[] }>; permissions?: string[] }) => {
        setPermissions(context.permissions ?? []);
        const active = context.contexts?.find((item) => item.branch_id === context.active_context?.branch_id);
        setStartRole(active?.roles.includes("VT-10") ? "VT-10" : "VT-11");
      })
      .catch(() => setPermissions([]));
  }, []);

  const handleAccept = async (orderId: string) => {
    setLoadingId(orderId);
    try {
      const updated = await acceptOrder(orderId);
      setOrders(orders.map((o) => (o.id === orderId ? updated : o)));
      toast({ title: "Tổ trưởng sơ chế đã tiếp nhận (VT-09)", description: `Lệnh ${updated.order_code} chuyển sang ACCEPTED`, variant: "success" });
    } catch (err: unknown) {
      toast({ title: "Lỗi tiếp nhận lệnh", description: err instanceof Error ? err.message : "Không thể tiếp nhận lệnh", variant: "error" });
    } finally {
      setLoadingId(null);
    }
  };

  const handleAllocate = async (orderId: string) => {
    setLoadingId(orderId);
    try {
      const updated = await allocateOrderLots(orderId);
      setOrders(orders.map((o) => (o.id === orderId ? updated : o)));
      toast({ title: "Đã phân bổ FEFO nguyên liệu kho", description: `Lệnh ${updated.order_code} chuyển sang ALLOCATED`, variant: "success" });
    } catch (err: unknown) {
      toast({ title: "Lỗi phân bổ kho", description: err instanceof Error ? err.message : "Không thể phân bổ kho", variant: "error" });
    } finally {
      setLoadingId(null);
    }
  };

  const handleStart = async (orderId: string) => {
    setLoadingId(orderId);
    try {
      const updated = await startOrder(orderId, startRole);
      setOrders(orders.map((o) => (o.id === orderId ? updated : o)));
      toast({ title: "Bắt đầu sơ chế & chế biến (VT-10 / VT-11)", description: `Đã trừ tồn kho nguyên liệu, lệnh ${updated.order_code} chuyển sang IN_PROGRESS`, variant: "success" });
    } catch (err: unknown) {
      toast({ title: "Lỗi bắt đầu chế biến", description: err instanceof Error ? err.message : "Không thể bắt đầu chế biến", variant: "error" });
    } finally {
      setLoadingId(null);
    }
  };

  const handleComplete = async (orderId: string, plannedQty: number) => {
    setLoadingId(orderId);
    try {
      const updated = await completeOrder(orderId, plannedQty, [], "VT-12");
      setOrders(orders.map((o) => (o.id === orderId ? updated : o)));
      toast({ title: "Đóng gói & Cấp đông hoàn tất (VT-12)", description: `Đã tạo lô thành phẩm QUARANTINED, chuyển sang chờ QC (VT-13)`, variant: "success" });
    } catch (err: unknown) {
      toast({ title: "Lỗi hoàn tất lệnh", description: err instanceof Error ? err.message : "Không thể hoàn tất lệnh", variant: "error" });
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <PageShell>
      <PageHeader
        title="Điều hành Sản xuất & Chế biến (VT-09 .. VT-12)"
        description="Quy trình Make-to-Stock: Tiếp nhận → Phân bổ FEFO → Sơ chế & Nấu → Đóng gói & Cấp đông"
      />

      <Card>
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
                  <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
                    Chưa có lệnh sản xuất nào được chuyển giao từ Chuyên gia dinh dưỡng (VT-21)
                  </TableCell>
                </TableRow>
              ) : (
                orders.map((o) => (
                  <TableRow key={o.id}>
                    <TableCell className="font-mono font-medium">{o.order_code}</TableCell>
                    <TableCell>{o.planned_quantity} {o.uom}</TableCell>
                    <TableCell>{o.actual_output_quantity > 0 ? `${o.actual_output_quantity} ${o.uom}` : "—"}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          o.status === "QC_PASSED"
                            ? "active"
                            : o.status === "COMPLETED" || o.status === "IN_PROGRESS"
                            ? "secondary"
                            : o.status === "QC_FAILED" || o.status === "FAILED"
                            ? "revoked"
                            : "outline"
                        }
                      >
                        {o.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {o.status === "HANDED_OFF" && permissions.includes("production:order:accept") && (
                        <Button
                          size="sm"
                          disabled={loadingId === o.id}
                          onClick={() => handleAccept(o.id)}
                        >
                          <CheckSquare className="h-4 w-4 mr-1" /> Tiếp nhận (VT-09)
                        </Button>
                      )}
                      {o.status === "ACCEPTED" && permissions.includes("production:order:allocate") && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-blue-600 text-blue-600 hover:bg-blue-50"
                          disabled={loadingId === o.id}
                          onClick={() => handleAllocate(o.id)}
                        >
                          <Layers className="h-4 w-4 mr-1" /> Phân bổ FEFO
                        </Button>
                      )}
                      {o.status === "ALLOCATED" && permissions.includes("production:order:start") && (
                        <Button
                          size="sm"
                          className="bg-amber-600 hover:bg-amber-700 text-white"
                          disabled={loadingId === o.id}
                          onClick={() => handleStart(o.id)}
                        >
                          <Play className="h-4 w-4 mr-1" /> Bắt đầu nấu (VT-10/11)
                        </Button>
                      )}
                      {o.status === "IN_PROGRESS" && permissions.includes("production:order:complete") && (
                        <Button
                          size="sm"
                          className="bg-purple-600 hover:bg-purple-700 text-white"
                          disabled={loadingId === o.id}
                          onClick={() => handleComplete(o.id, o.planned_quantity)}
                        >
                          <Box className="h-4 w-4 mr-1" /> Đóng gói & Cấp đông (VT-12)
                        </Button>
                      )}
                      {o.status === "COMPLETED" && (
                        <span className="text-sm font-medium text-amber-600 flex items-center justify-end">
                          <Clock className="h-4 w-4 mr-1" /> Chờ QC nghiệm thu (VT-13)
                        </span>
                      )}
                      {o.status === "QC_PASSED" && (
                        <span className="text-sm font-medium text-green-600 flex items-center justify-end">
                          <CheckCircle2 className="h-4 w-4 mr-1" /> QC Đạt — Sẵn sàng lên kệ
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </PageShell>
  );
}
