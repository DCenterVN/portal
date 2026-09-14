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
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-12">
      {/* Brand Header */}
      <header className="bg-gradient-to-r from-emerald-700 to-teal-800 text-white py-8 px-4 text-center shadow-md">
        <div className="max-w-xl mx-auto flex flex-col items-center">
          <div className="h-12 w-12 bg-white/10 rounded-full flex items-center justify-center mb-3">
            <Leaf className="h-7 w-7 text-emerald-300" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Hệ Thống Thực Phẩm Sạch Việt Sạch</h1>
          <p className="text-emerald-100 text-sm mt-1">Cổng thông tin Truy xuất Nguồn gốc & Minh bạch Dinh dưỡng (VT-01)</p>
          <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-xs font-mono">
            <QrCode className="h-3.5 w-3.5" /> Mã QR: {trace.trace_code}
          </div>
        </div>
      </header>

      <main className="max-w-xl mx-auto px-4 mt-6 space-y-6">
        {/* Quality Verified Card */}
        <Card className="border-emerald-200 bg-emerald-50/40 shadow-sm overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-emerald-600 rounded-full flex items-center justify-center text-white shrink-0">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <div>
                <h2 className="font-bold text-emerald-950 text-lg flex items-center gap-2">
                  Kiểm định thành phẩm
                  <Badge variant="active" className="text-xs font-normal">{trace.qc_status}</Badge>
                </h2>
                <p className="text-xs text-emerald-700 mt-0.5">
                  Trạng thái và hành trình bên dưới được lấy từ hồ sơ sản xuất đã truy xuất.
                </p>
              </div>
            </div>

            <div className="mt-6 border-t border-emerald-200/60 pt-4 grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-xs text-slate-500 block">Sản phẩm:</span>
                <span className="font-semibold text-slate-800">{trace.product_name}</span>
              </div>
              <div>
                <span className="text-xs text-slate-500 block">Khẩu phần:</span>
                <span className="font-semibold text-slate-800">{trace.variant_name}</span>
              </div>
              <div>
                <span className="text-xs text-slate-500 block">Ngày sản xuất:</span>
                <span className="font-medium text-slate-700">
                  {new Date(trace.produced_at).toLocaleDateString("vi-VN")}
                </span>
              </div>
              <div>
                <span className="text-xs text-slate-500 block">Hạn sử dụng:</span>
                <span className="font-medium text-emerald-800 font-semibold">
                  {new Date(trace.expires_at).toLocaleDateString("vi-VN")}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Ingredients Card */}
        <Card className="shadow-sm">
          <CardContent className="p-6">
            <h3 className="font-bold text-slate-900 text-base mb-4 flex items-center gap-2">
              <Award className="h-5 w-5 text-emerald-600" />
              Nguồn nguyên liệu đã ghi nhận
            </h3>
            <div className="space-y-3">
              {trace.ingredients.map((ing, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100 text-sm">
                  <span className="font-medium text-slate-800">{ing.material_name}</span>
                  <Badge variant="outline" className="text-xs text-emerald-700 bg-emerald-50">
                    {ing.supplier_code}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Timeline Stages */}
        <Card className="shadow-sm">
          <CardContent className="p-6">
            <h3 className="font-bold text-slate-900 text-base mb-4 flex items-center gap-2">
              <Clock className="h-5 w-5 text-teal-600" />
              Nhật ký Hành trình Sản xuất & Lên kệ
            </h3>
            <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-emerald-200">
              {trace.timeline.map((step, idx) => (
                <div key={idx} className="relative">
                  <div className="absolute -left-6 top-1 h-5 w-5 rounded-full bg-emerald-600 text-white flex items-center justify-center ring-4 ring-white">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-slate-900">{step.title}</h4>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {new Date(step.timestamp).toLocaleString("vi-VN")}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
