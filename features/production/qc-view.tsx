"use client";

import React, { useId, useState } from "react";
import { ShieldCheck, CheckCircle2, XCircle, AlertTriangle, Thermometer } from "lucide-react";
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
import { ProductionOrder, decideQC } from "@/lib/api/production";

interface QCViewProps {
  completedOrders: ProductionOrder[];
}

export function QCView({ completedOrders }: QCViewProps) {
  const formId = useId();
  const { toast } = useToast();
  const [orders, setOrders] = useState<ProductionOrder[]>(completedOrders);
  const [selectedOrder, setSelectedOrder] = useState<ProductionOrder | null>(null);
  const [temperature, setTemperature] = useState(-18.5);
  const [packagePassed, setPackagePassed] = useState(true);
  const [sensoryNotes, setSensoryNotes] = useState("");
  const [loading, setLoading] = useState(false);

  const handleDecision = async (decision: "PASS" | "FAIL") => {
    if (!selectedOrder) return;
    setLoading(true);
    try {
      const res = await decideQC(selectedOrder.id, {
        decision,
        core_temperature_celsius: temperature,
        package_check_passed: packagePassed,
        sensory_result: { notes: sensoryNotes.trim() },
        failure_reason: decision === "FAIL" ? "Không đạt nhiệt độ tâm hoặc bao bì lỗi" : undefined,
      });
      setOrders(orders.map((o) => (o.id === selectedOrder.id ? res.production_order : o)));
      setSelectedOrder(null);
      toast({
        title: decision === "PASS" ? "Nghiệm thu QC ĐẠT (PASS)" : "Nghiệm thu QC KHÔNG ĐẠT (FAIL)",
        description: `Lệnh ${res.production_order.order_code} đã hoàn tất kiểm định chất lượng (SoD Verified)`,
        variant: "success",
      });
    } catch (err: unknown) {
      toast({
        title: "Lỗi kiểm định QC",
        description: err instanceof Error ? err.message : "Lỗi không xác định",
        variant: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageShell className="bg-[var(--color-bg)] text-[var(--color-ink)]">
      <PageHeader
        title="Kiểm định Chất lượng Thành phẩm (VT-13 QC)"
        description="Nghiệm thu cảm quan, nhiệt độ tâm cấp đông (-18°C) và kiểm tra bao bì với Phân tách trách nhiệm (SoD)"
      />

      <div className="mb-6 p-4 border border-[var(--color-line)] bg-[var(--color-tint)] rounded-lg flex items-start gap-3">
        <AlertTriangle className="h-5 w-5 text-[var(--color-sun)] shrink-0 mt-0.5" />
        <div className="text-sm text-[var(--color-warn-ink)]">
          <p className="font-semibold">Nguyên tắc Phân tách Trách nhiệm (SoD Enforcement):</p>
          <p>
            Chuyên viên QC (VT-13) bắt buộc phải là nhân sự <strong>độc lập</strong> với người trực tiếp điều phối, sơ chế, nấu chín hoặc đóng gói lô hàng. Hệ thống tự động từ chối (403 Forbidden) nếu phát hiện trùng lặp người thực hiện.
          </p>
        </div>
      </div>

      {selectedOrder && (
        <Card className="mb-6 border-[var(--color-line)] bg-[var(--color-surface)] text-[var(--color-ink)]">
          <CardContent className="pt-6">
            <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-[var(--color-info)]" />
              Nghiệm thu Lệnh: {selectedOrder.order_code} ({selectedOrder.planned_quantity} {selectedOrder.uom})
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label htmlFor={`${formId}-temperature`} className="text-sm font-medium flex items-center gap-1">
                  <Thermometer className="h-4 w-4 text-[var(--color-info)]" /> Nhiệt độ tâm sau cấp đông (°C)
                </label>
                <input
                  id={`${formId}-temperature`}
                  type="number"
                  step="0.1"
                  style={{ borderWidth: "1.5px" }}
                    className="w-full mt-1 px-3 h-11 border bg-[var(--color-surface)] text-[var(--color-ink)] border-[var(--color-input-border)] rounded-[var(--radius-md)] focus:outline-none focus:ring-2 focus:ring-[var(--color-focus)]"
                  value={temperature}
                  onChange={(e) => setTemperature(Number(e.target.value))}
                />
                <p className="text-xs text-[var(--color-muted)] mt-1">Tiêu chuẩn cấp đông an toàn: ≤ -18.0°C</p>
              </div>
              <div>
                <label className="text-sm font-medium">Kiểm tra niêm phong & bao bì</label>
                <div className="mt-2 flex items-center gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      className="accent-[var(--color-primary)] border-[var(--color-input-border)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus)]"
                      name="packageCheck"
                      checked={packagePassed}
                      onChange={() => setPackagePassed(true)}
                    />
                    Bao bì nguyên vẹn, hút chân không đạt
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      className="accent-[var(--color-primary)] border-[var(--color-input-border)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus)]"
                      name="packageCheck"
                      checked={!packagePassed}
                      onChange={() => setPackagePassed(false)}
                    />
                    Bao bì lỗi / hở
                  </label>
                </div>
              </div>
              <div className="md:col-span-2">
                <label htmlFor={`${formId}-sensory`} className="text-sm font-medium">Ghi nhận kiểm tra cảm quan</label>
                <textarea id={`${formId}-sensory`} style={{ borderWidth: "1.5px" }} className="mt-1 min-h-24 w-full rounded-[var(--radius-md)] border bg-[var(--color-surface)] text-[var(--color-ink)] border-[var(--color-input-border)] p-3 focus:outline-none focus:ring-2 focus:ring-[var(--color-focus)]" required value={sensoryNotes} onChange={(event) => setSensoryNotes(event.target.value)} placeholder="Màu sắc, mùi, cấu trúc và nhận xét thực tế của mẫu kiểm tra" />
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                disabled={loading || !sensoryNotes.trim()}
                onClick={() => handleDecision("PASS")}
              >
                <CheckCircle2 className="h-4 w-4 mr-1" /> Phê duyệt QC (PASS) — Cho phép lên kệ
              </Button>
              <Button
                disabled={loading || !sensoryNotes.trim()}
                variant="destructive"
                onClick={() => handleDecision("FAIL")}
              >
                <XCircle className="h-4 w-4 mr-1" /> Từ chối QC (FAIL) — Hủy lô
              </Button>
              <Button variant="ghost" onClick={() => setSelectedOrder(null)}>Hủy bỏ</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="bg-[var(--color-surface)] text-[var(--color-ink)] border-[var(--color-line)]">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Mã lệnh</TableHead>
                <TableHead>Số lượng thành phẩm</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead className="text-right">Hành động QC</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-6 text-[var(--color-muted)]">
                    Không có lô thành phẩm nào đang chờ kiểm định QC
                  </TableCell>
                </TableRow>
              ) : (
                orders.map((o) => (
                  <TableRow key={o.id}>
                    <TableCell className="font-mono font-medium">{o.order_code}</TableCell>
                    <TableCell>{o.actual_output_quantity > 0 ? o.actual_output_quantity : o.planned_quantity} {o.uom}</TableCell>
                    <TableCell>
                      <Badge variant={o.status === "QC_PASSED" ? "active" : o.status === "QC_FAILED" ? "revoked" : "secondary"}>
                        {o.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {o.status === "COMPLETED" && (
                        <Button size="sm" variant={!selectedOrder && orders.find((order) => order.status === "COMPLETED")?.id === o.id ? "default" : "outline"} onClick={() => setSelectedOrder(o)}>
                          <ShieldCheck className="h-4 w-4 mr-1" /> Tiến hành nghiệm thu
                        </Button>
                      )}
                      {o.status === "QC_PASSED" && (
                        <Badge variant="outline" className="text-[var(--color-ink)] bg-[var(--color-tint)] border-[var(--color-leaf)]">
                          Đã phê duyệt đạt chuẩn
                        </Badge>
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
