"use client";

import { formatDate, formatDateTime } from "@/lib/format-date";
import React from "react";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/patterns/status-badge";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState, ErrorState, LoadingState } from "@/components/patterns/empty-state";
import { useTrace } from "./use-trace";
import type { PublicTraceability } from "@/lib/api/production";
import { BRAND_NAME } from "@/lib/brand";

interface TraceViewProps {
  code?: string;
  trace?: PublicTraceability;
}

export function TraceView({ code = "", trace: initialTrace }: TraceViewProps) {
  const { trace: loadedTrace, error, loading, retry } = useTrace(code);
  const trace = initialTrace ?? loadedTrace;
  if (initialTrace) return <TraceContent trace={initialTrace} />;
  if (loading) return <LoadingState title="Đang tải thông tin truy xuất…" />;
  if (error) return <ErrorState title="Không thể tải thông tin truy xuất" onRetry={retry} />;
  if (!trace) return <EmptyState title="Không tìm thấy thông tin truy xuất" />;
  return <TraceContent trace={trace} />;
}

function TraceContent({ trace }: { trace: PublicTraceability }) {
  return (
    <div className="min-h-screen bg-background text-foreground pb-12">
      {/* Brand Header */}
      <header className="bg-card text-foreground py-8 px-4 text-center ">
        <div className="max-w-xl mx-auto flex flex-col items-center">
          <h1 className="text-xl font-semibold">Truy xuất nguồn gốc {BRAND_NAME}</h1>
          <p className="text-muted-foreground text-sm mt-1">Cổng thông tin Truy xuất Nguồn gốc & Minh bạch Dinh dưỡng (VT-01)</p>
          <div className="mt-3 inline-flex items-center rounded-lg bg-muted px-2 py-1 text-xs font-mono">
            Mã QR: {trace.trace_code}
          </div>
        </div>
      </header>

      <div className="max-w-xl mx-auto px-4 mt-6 space-y-6">
        {/* Quality Verified Card */}
        <Card className="border-border bg-card overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div>
                <h2 className="font-semibold text-foreground text-lg flex items-center gap-2">
                  Kiểm định thành phẩm
                  <StatusBadge tone="success" className="text-xs font-normal">{trace.qc_status}</StatusBadge>
                </h2>
                <p className="text-xs text-foreground mt-0.5">
                  Trạng thái và hành trình bên dưới được lấy từ hồ sơ sản xuất đã truy xuất.
                </p>
              </div>
            </div>

            <div className="mt-6 border-t border-border pt-4 grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-xs text-muted-foreground block">Sản phẩm:</span>
                <span className="font-semibold text-foreground">{trace.product_name}</span>
              </div>
              <div>
                <span className="text-xs text-muted-foreground block">Khẩu phần:</span>
                <span className="font-semibold text-foreground">{trace.variant_name}</span>
              </div>
              <div>
                <span className="text-xs text-muted-foreground block">Ngày sản xuất:</span>
                <span className="font-medium text-foreground">
                  {formatDate(trace.produced_at)}
                </span>
              </div>
              <div>
                <span className="text-xs text-muted-foreground block">Hạn sử dụng:</span>
                <span className="font-medium text-foreground font-semibold">
                  {formatDate(trace.expires_at)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Ingredients Card */}
        <Card className="border-border bg-card ">
          <CardContent className="p-6">
            <h3 className="font-semibold text-foreground text-base mb-4">
              Nguồn nguyên liệu đã ghi nhận
            </h3>
            <div className="space-y-3">
              {trace.ingredients.map((ing, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-background rounded-lg border border-border text-sm">
                  <span className="font-medium text-foreground">{ing.material_name}</span>
                  <Badge variant="outline" className="text-xs text-foreground bg-card">
                    {ing.supplier_code}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Timeline Stages */}
        <Card className="border-border bg-card ">
          <CardContent className="p-6">
            <h3 className="font-semibold text-foreground text-base mb-4">
              Nhật ký Hành trình Sản xuất & Lên kệ
            </h3>
            <div className="relative pl-5 space-y-6 before:absolute before:left-0.5 before:top-2 before:bottom-2 before:w-px before:bg-border">
              {trace.timeline.map((step, idx) => (
                <div key={idx} className="relative">
                  <div className="absolute -left-5 top-1.5 size-1.5 rounded-full bg-border" aria-hidden="true" />
                  <div>
                    <h4 className="text-sm font-semibold text-foreground">{step.title}</h4>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {formatDateTime(step.timestamp)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
