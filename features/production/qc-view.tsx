"use client";

import React, { useState } from "react";
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
    <PageShell>
      <PageHeader
        title="Kiểm định Chất lượng Thành phẩm (VT-13 QC)"
        description="Nghiệm thu cảm quan, nhiệt độ tâm cấp đông (-18°C) và kiểm tra bao bì với Phân tách trách nhiệm (SoD)"
      />

      <div className="mb-6 p-4 border border-amber-200 bg-amber-50 rounded-lg flex items-start gap-3">
        <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
        <div className="text-sm text-amber-800">
          <p className="font-semibold">Nguyên tắc Phân tách Trách nhiệm (SoD Enforcement):</p>
          <p>
            Chuyên viên QC (VT-13) bắt buộc phải là nhân sự <strong>độc lập</strong> với người trực tiếp điều phối, sơ chế, nấu chín hoặc đóng gói lô hàng. Hệ thống tự động từ chối (403 Forbidden) nếu phát hiện trùng lặp người thực hiện.
          </p>
        </div>
      </div>

      {selectedOrder && (
        <Card className="mb-6 border-indigo-200 bg-indigo-50/20">
          <CardContent className="pt-6">
            <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-indigo-600" />
              Nghiệm thu Lệnh: {selectedOrder.order_code} ({selectedOrder.planned_quantity} {selectedOrder.uom})
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="text-sm font-medium flex items-center gap-1">
                  <Thermometer className="h-4 w-4 text-blue-600" /> Nhiệt độ tâm sau cấp đông (°C)
                </label>
                <input
                  type="number"
                  step="0.1"
                  className="w-full mt-1 p-2 border rounded-md"
                  value={temperature}
                  onChange={(e) => setTemperature(Number(e.target.value))}
                />
                <p className="text-xs text-muted-foreground mt-1">Tiêu chuẩn cấp đông an toàn: ≤ -18.0°C</p>
              </div>
              <div>
                <label className="text-sm font-medium">Kiểm tra niêm phong & bao bì</label>
                <div className="mt-2 flex items-center gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="packageCheck"
                      checked={packagePassed}
                      onChange={() => setPackagePassed(true)}
                    />
                    Bao bì nguyên vẹn, hút chân không đạt
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="packageCheck"
                      checked={!packagePassed}
                      onChange={() => setPackagePassed(false)}
                    />
                    Bao bì lỗi / hở
                  </label>
                </div>
              </div>
              <div className="md:col-span-2">
                <label className="text-sm font-medium">Ghi nhận kiểm tra cảm quan</label>
                <textarea className="mt-1 min-h-24 w-full rounded-md border p-2" required value={sensoryNotes} onChange={(event) => setSensoryNotes(event.target.value)} placeholder="Màu sắc, mùi, cấu trúc và nhận xét thực tế của mẫu kiểm tra" />
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                disabled={loading || !sensoryNotes.trim()}
                className="bg-green-600 hover:bg-green-700 text-white"
                onClick={() => handleDecision("PASS")}
              >
                <CheckCircle2 className="h-4 w-4 mr-1" /> Phê duyệt QC (PASS) — Cho phép lên kệ
              </Button>
              <Button
                disabled={loading || !sensoryNotes.trim()}
                variant="outline"
                className="text-red-600 border-red-300 hover:bg-red-50"
                onClick={() => handleDecision("FAIL")}
              >
                <XCircle className="h-4 w-4 mr-1" /> Từ chối QC (FAIL) — Hủy lô
              </Button>
              <Button variant="ghost" onClick={() => setSelectedOrder(null)}>Hủy bỏ</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
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
                  <TableCell colSpan={4} className="text-center py-6 text-muted-foreground">
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
                        <Button size="sm" onClick={() => setSelectedOrder(o)}>
                          <ShieldCheck className="h-4 w-4 mr-1" /> Tiến hành nghiệm thu
                        </Button>
                      )}
                      {o.status === "QC_PASSED" && (
                        <Badge variant="outline" className="text-green-700 bg-green-50">
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
