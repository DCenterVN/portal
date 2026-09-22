"use client";

import Link from "next/link";
import { useDashboard } from "../hooks/use-dashboard";
import { Card, Badge, Button, Skeleton } from "@dcentervn/ui";

export function DashboardView() {
  const { user, metrics, activities, isLoading, refresh } = useDashboard();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Skeleton className="h-28 rounded-xl" />
          <Skeleton className="h-28 rounded-xl" />
          <Skeleton className="h-28 rounded-xl" />
          <Skeleton className="h-28 rounded-xl" />
        </div>
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Welcome & Cold Chain Live Status Bar */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex items-center gap-2 pb-1">
            <Badge variant="forest">Việt Sạch Ops</Badge>
            <Badge variant="cold" pulse={true}>
              -18,5 °C · Chuỗi lạnh ổn định
            </Badge>
            <Badge variant="success">100% VietGAP</Badge>
          </div>
          <h1 className="font-serif text-3xl font-bold tracking-tight text-[var(--color-ink)]">
            Chào mừng{user?.displayName ? `, ${user.displayName}` : ""}
          </h1>
          <p className="mt-1 text-sm text-[var(--color-muted)]">
            Bảng điều hành tổng quan hoạt động chuỗi cung ứng & kho lạnh sâu Việt Sạch
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            variant="primary"
            size="sm"
            onClick={() => alert("Mở form Kiểm nhận & Thực nhận hàng hóa đầu vào")}
            className="text-xs font-semibold"
          >
            + Nhập kho QC
          </Button>
          <Button
            variant="cold"
            size="sm"
            onClick={() => alert("Điều phối lịch trình xe lạnh")}
            className="text-xs font-semibold"
          >
            Điều phối xe lạnh
          </Button>
          <Button variant="ghost" size="sm" onClick={() => void refresh()} className="text-xs">
            Làm mới
          </Button>
        </div>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {metrics.map((metric, idx) => (
          <Card
            key={metric.id}
            variant={idx === 0 ? "cold" : "default"}
            className="space-y-2 border"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium tracking-wider text-[var(--color-muted)]">
                {metric.label}
              </span>
              {idx === 0 && (
                <span className="text-xs font-bold text-sky-600 dark:text-sky-400">
                  ❄ IoT hoạt động
                </span>
              )}
            </div>
            <div className="font-serif text-2xl font-bold text-[var(--color-ink)]">
              {metric.value}
            </div>
            <p
              className={`text-xs font-medium ${
                metric.changeType === "positive"
                  ? "text-emerald-600 dark:text-emerald-400"
                  : metric.changeType === "negative"
                    ? "text-[var(--color-danger)]"
                    : "text-[var(--color-muted)]"
              }`}
            >
              {metric.change}
            </p>
          </Card>
        ))}
      </div>

      {/* Operations Activity Feed */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="font-serif text-xl font-semibold text-[var(--color-ink)]">
              Nhật ký chuỗi cung ứng thời gian thực
            </h2>
            <Badge variant="primary" pulse={true}>
              Trực tiếp
            </Badge>
          </div>
          <span className="text-xs text-[var(--color-muted)]">
            Cập nhật tự động qua Kafka IoT
          </span>
        </div>

        <Card variant="default" className="divide-y divide-[var(--color-line)] p-0">
          {activities.map((item) => (
            <div
              key={item.id}
              className="flex flex-col gap-2 p-4 transition-colors hover:bg-[var(--color-panel-strong)]/40 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="space-y-1">
                <p className="text-sm font-medium text-[var(--color-ink)]">
                  {item.title}
                </p>
                <div className="flex items-center gap-2 text-xs text-[var(--color-muted)]">
                  <span className="font-semibold text-[var(--color-forest)]">{item.branch}</span>
                  <span>•</span>
                  <span>{item.time}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge
                  variant={
                    item.status === "completed"
                      ? "success"
                      : item.status === "pending"
                        ? "warning"
                        : "cold"
                  }
                >
                  {item.status === "completed"
                    ? "Đã kiểm định"
                    : item.status === "pending"
                      ? "Đang chờ QC"
                      : "Đang vận chuyển"}
                </Badge>
              </div>
            </div>
          ))}
        </Card>
      </div>
    </div>
  );
}
