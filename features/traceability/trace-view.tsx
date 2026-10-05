"use client";

import React from "react";
import { ShieldCheck, CheckCircle2, QrCode, Clock, Leaf, Award } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { PublicTraceability } from "@/lib/api/production";

interface TraceViewProps {
  trace: PublicTraceability;
}

export function TraceView({ trace }: TraceViewProps) {
  return (
    <div className="min-h-screen bg-[var(--color-bg)] text-[var(--color-ink)] pb-12">
      {/* Brand Header */}
      <header className="bg-[var(--color-surface)] text-[var(--color-ink)] py-8 px-4 text-center shadow-[var(--elevation-shadow-card)]">
        <div className="max-w-xl mx-auto flex flex-col items-center">
          <div className="h-12 w-12 bg-[var(--color-tint)] rounded-full flex items-center justify-center mb-3">
            <Leaf className="h-7 w-7 text-[var(--color-ink)]" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Hệ Thống Thực Phẩm Sạch Việt Sạch</h1>
          <p className="text-[var(--color-muted)] text-sm mt-1">Cổng thông tin Truy xuất Nguồn gốc & Minh bạch Dinh dưỡng (VT-01)</p>
          <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 bg-[var(--color-tint)] rounded-full text-xs font-mono">
            <QrCode className="h-3.5 w-3.5" /> Mã QR: {trace.trace_code}
          </div>
        </div>
      </header>

      <div className="max-w-xl mx-auto px-4 mt-6 space-y-6">
        {/* Quality Verified Card */}
        <Card className="border-[var(--color-line)] bg-[var(--color-surface)] shadow-[var(--elevation-shadow-card)] overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-[var(--color-tint)] rounded-full flex items-center justify-center text-[var(--color-ink)] shrink-0">
                <ShieldCheck className="h-6 w-6 text-[var(--color-leaf)]" />
              </div>
              <div>
                <h2 className="font-bold text-[var(--color-ink)] text-lg flex items-center gap-2">
                  Kiểm định thành phẩm
                  <Badge variant="active" className="text-xs font-normal">{trace.qc_status}</Badge>
                </h2>
                <p className="text-xs text-[var(--color-ink)] mt-0.5">
                  Trạng thái và hành trình bên dưới được lấy từ hồ sơ sản xuất đã truy xuất.
                </p>
              </div>
            </div>

            <div className="mt-6 border-t border-[var(--color-line)] pt-4 grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-xs text-[var(--color-muted)] block">Sản phẩm:</span>
                <span className="font-semibold text-[var(--color-ink)]">{trace.product_name}</span>
              </div>
              <div>
                <span className="text-xs text-[var(--color-muted)] block">Khẩu phần:</span>
                <span className="font-semibold text-[var(--color-ink)]">{trace.variant_name}</span>
              </div>
              <div>
                <span className="text-xs text-[var(--color-muted)] block">Ngày sản xuất:</span>
                <span className="font-medium text-[var(--color-ink)]">
                  {new Date(trace.produced_at).toLocaleDateString("vi-VN")}
                </span>
              </div>
              <div>
                <span className="text-xs text-[var(--color-muted)] block">Hạn sử dụng:</span>
                <span className="font-medium text-[var(--color-ink)] font-semibold">
                  {new Date(trace.expires_at).toLocaleDateString("vi-VN")}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Ingredients Card */}
        <Card className="border-[var(--color-line)] bg-[var(--color-surface)] shadow-[var(--elevation-shadow-card)]">
          <CardContent className="p-6">
            <h3 className="font-bold text-[var(--color-ink)] text-base mb-4 flex items-center gap-2">
              <Award className="h-5 w-5 text-[var(--color-ink)]" />
              Nguồn nguyên liệu đã ghi nhận
            </h3>
            <div className="space-y-3">
              {trace.ingredients.map((ing, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-[var(--color-bg)] rounded-lg border border-[var(--color-line)] text-sm">
                  <span className="font-medium text-[var(--color-ink)]">{ing.material_name}</span>
                  <Badge variant="outline" className="text-xs text-[var(--color-ink)] bg-[var(--color-surface)]">
                    {ing.supplier_code}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Timeline Stages */}
        <Card className="border-[var(--color-line)] bg-[var(--color-surface)] shadow-[var(--elevation-shadow-card)]">
          <CardContent className="p-6">
            <h3 className="font-bold text-[var(--color-ink)] text-base mb-4 flex items-center gap-2">
              <Clock className="h-5 w-5 text-[var(--color-ink)]" />
              Nhật ký Hành trình Sản xuất & Lên kệ
            </h3>
            <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-[var(--color-line)]">
              {trace.timeline.map((step, idx) => (
                <div key={idx} className="relative">
                  <div className="absolute -left-6 top-1 h-5 w-5 rounded-full bg-[var(--color-tint)] text-[var(--color-ink)] flex items-center justify-center ring-4 ring-[var(--color-surface)]">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                  </div>
                  <div>
                    <h4 className="font-[family-name:var(--font-quicksand,var(--font-display))] text-sm font-semibold text-[var(--color-ink)]">{step.title}</h4>
                    <p className="text-xs text-[var(--color-muted)] mt-0.5">
                      {new Date(step.timestamp).toLocaleString("vi-VN")}
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
