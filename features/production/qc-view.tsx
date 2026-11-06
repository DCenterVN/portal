"use client";

import React, { useId } from "react";
import { InlineAlert } from "@/components/patterns/inline-alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
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
import { useQcDecision } from "./use-qc-decision";

interface QCViewProps {
  completedOrders?: ProductionOrder[];
}

export function QCView({ completedOrders }: QCViewProps) {
  const formId = useId();
  const { orders, listLoading, listError, selectedOrder, setSelectedOrder, temperature, setTemperature, packagePassed, setPackagePassed, sensoryNotes, setSensoryNotes, loading, handleDecision } = useQcDecision(completedOrders);

  return (
    <PageShell>
      <PageHeading
        title="Kiểm định Chất lượng Thành phẩm (VT-13 QC)"
        description="Nghiệm thu cảm quan, nhiệt độ tâm cấp đông (-18°C) và kiểm tra bao bì với Phân tách trách nhiệm (SoD)"
      />

      <InlineAlert tone="warning" className="mb-6">
        <p className="font-medium">Nguyên tắc Phân tách Trách nhiệm (SoD Enforcement):</p>
        <p>
          Chuyên viên QC (VT-13) bắt buộc phải là nhân sự <strong>độc lập</strong> với người trực tiếp điều phối, sơ chế, nấu chín hoặc đóng gói lô hàng. Hệ thống tự động từ chối (403 Forbidden) nếu phát hiện trùng lặp người thực hiện.
        </p>
      </InlineAlert>

      {selectedOrder && (
        <Card className="mb-6">
          <CardContent className="pt-6">
            <h3 className="mb-4 text-lg font-semibold">
              Nghiệm thu Lệnh: {selectedOrder.order_code} ({selectedOrder.planned_quantity} {selectedOrder.uom})
            </h3>
            <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="grid gap-1.5">
                <Label htmlFor={`${formId}-temperature`}>Nhiệt độ tâm sau cấp đông (°C)</Label>
                <Input
                  id={`${formId}-temperature`}
                  type="number"
                  step="0.1"
                  value={temperature}
                  onChange={(e) => setTemperature(Number(e.target.value))}
                />
                <p className="text-xs text-muted-foreground">Tiêu chuẩn cấp đông an toàn: ≤ -18.0°C</p>
              </div>
              <div className="grid gap-1.5">
                <Label id={`${formId}-package`}>Kiểm tra niêm phong & bao bì</Label>
                <RadioGroup aria-labelledby={`${formId}-package`} className="mt-1 flex items-center gap-4" value={packagePassed ? "ok" : "bad"} onValueChange={(value) => setPackagePassed(value === "ok")}>
                  <div className="flex items-center gap-2">
                    <RadioGroupItem id={`${formId}-package-ok`} value="ok" />
                    <Label htmlFor={`${formId}-package-ok`} className="font-normal">Bao bì nguyên vẹn, hút chân không đạt</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <RadioGroupItem id={`${formId}-package-bad`} value="bad" />
                    <Label htmlFor={`${formId}-package-bad`} className="font-normal">Bao bì lỗi / hở</Label>
                  </div>
                </RadioGroup>
              </div>
              <div className="grid gap-1.5 md:col-span-2">
                <Label htmlFor={`${formId}-sensory`}>Ghi nhận kiểm tra cảm quan</Label>
                <Textarea id={`${formId}-sensory`} className="min-h-24" required value={sensoryNotes} onChange={(event) => setSensoryNotes(event.target.value)} placeholder="Màu sắc, mùi, cấu trúc và nhận xét thực tế của mẫu kiểm tra" />
              </div>
            </div>
            <div className="flex gap-2">
              <Button disabled={loading || !sensoryNotes.trim()} onClick={() => handleDecision("PASS")}>
                Phê duyệt QC (PASS) — Cho phép lên kệ
              </Button>
              <Button disabled={loading || !sensoryNotes.trim()} variant="destructive" onClick={() => handleDecision("FAIL")}>
                Từ chối QC (FAIL) — Hủy lô
              </Button>
              <Button variant="ghost" onClick={() => setSelectedOrder(null)}>Hủy bỏ</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {listError && <InlineAlert className="mb-4">{listError}</InlineAlert>}
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
                  <TableCell colSpan={4} className="py-6 text-center text-muted-foreground">
                    {listLoading ? "Đang tải lô thành phẩm…" : "Không có lô thành phẩm nào đang chờ kiểm định QC"}
                  </TableCell>
                </TableRow>
              ) : (
                orders.map((o) => (
                  <TableRow key={o.id}>
                    <TableCell className="font-mono font-medium">{o.order_code}</TableCell>
                    <TableCell>{o.actual_output_quantity > 0 ? o.actual_output_quantity : o.planned_quantity} {o.uom}</TableCell>
                    <TableCell>
                      <StatusBadge tone={o.status === "QC_PASSED" ? "success" : o.status === "QC_FAILED" ? "danger" : "neutral"}>
                        {o.status}
                      </StatusBadge>
                    </TableCell>
                    <TableCell className="text-right">
                      {o.status === "COMPLETED" && (
                        <Button size="sm" variant={!selectedOrder && orders.find((order) => order.status === "COMPLETED")?.id === o.id ? "default" : "outline"} onClick={() => setSelectedOrder(o)}>
                          Tiến hành nghiệm thu
                        </Button>
                      )}
                      {o.status === "QC_PASSED" && (
                        <span className="text-sm text-muted-foreground">Đã phê duyệt đạt chuẩn</span>
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
