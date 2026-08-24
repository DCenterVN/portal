"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Users,
  MapPin,
  Clock,
  ArrowUpRight,
  Search,
  Plus,
  CheckCircle2,
  ThermometerSnowflake,
  Coins,
  Building2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { BranchInfo, DEFAULT_FALLBACK_BRANCH } from "@/components/navbar";

interface BranchesViewProps {
  initialBranches: BranchInfo[];
}

export function BranchesView({ initialBranches }: BranchesViewProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const safeBranches = initialBranches && initialBranches.length > 0 ? initialBranches : [DEFAULT_FALLBACK_BRANCH];
  const [activeBranchId, setActiveBranchId] = useState(safeBranches[0]?.id ?? "br-01-q7");

  const filteredBranches = safeBranches.filter(
    (b) =>
      b.name.toLowerCase().includes(search.toLowerCase()) ||
      b.code.toLowerCase().includes(search.toLowerCase()) ||
      b.address.toLowerCase().includes(search.toLowerCase())
  );

  const handleSelectBranch = (branchId: string) => {
    setActiveBranchId(branchId);
    router.push("/memberships");
  };

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-6 border-b border-[var(--border)]">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-xl bg-sky-500/10 text-[var(--primary)]">
              <Building2 className="size-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-extrabold tracking-tight text-[var(--foreground)]">
                  Danh sách Chi nhánh Vận hành
                </h1>
                <Badge variant="secondary" dot={false} className="text-xs font-bold px-2.5 py-0.5 rounded-full">
                  {safeBranches.length} Chi nhánh
                </Badge>
              </div>
              <p className="text-xs text-[var(--muted-foreground)] mt-0.5 font-medium">
                Chọn chi nhánh cấp đông để chuyển đổi ngữ cảnh làm việc, quản lý kho hàng và nhân sự
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative w-64 sm:w-80">
            <Search className="absolute left-3 top-2.5 size-3.5 text-[var(--muted-foreground)]" />
            <Input
              placeholder="Tìm mã hoặc tên chi nhánh..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 text-xs h-9 rounded-xl bg-[var(--card)] text-[var(--foreground)] border-[var(--border)]"
            />
          </div>
          <Button size="sm" className="gap-1.5 text-xs h-9 font-bold rounded-xl bg-gradient-to-r from-[#0284C7] to-emerald-600 hover:opacity-95 text-white shadow-md shadow-sky-500/15">
            <Plus className="size-3.5" />
            <span>Thêm Chi Nhánh</span>
          </Button>
        </div>
      </div>

      {/* Branches Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-6">
        {filteredBranches.map((branch) => {
          const isSelected = activeBranchId === branch.id;
          return (
            <Card
              key={branch.id}
              className={`relative flex flex-col justify-between transition-all rounded-2xl border bg-[var(--card)] text-[var(--card-foreground)] overflow-hidden ${
                isSelected
                  ? "border-[var(--primary)] shadow-lg ring-2 ring-sky-500/20"
                  : "border-[var(--border)] hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-md"
              }`}
            >
              {/* Selected Pill Header */}
              {isSelected && (
                <div className="absolute top-3 right-4 z-10">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-[#0284C7] to-emerald-600 px-3 py-0.5 text-[11px] font-bold text-white shadow-sm">
                    <CheckCircle2 className="size-3" /> Đang vận hành
                  </span>
                </div>
              )}

              <CardHeader className="pb-3 pt-5">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-lg bg-[var(--secondary)] text-[var(--foreground)] border border-[var(--border)]">
                      {branch.code}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-50 dark:bg-sky-950/60 text-[var(--primary)] border border-sky-200/50 dark:border-sky-800/50">
                      {branch.type === "MAIN" ? "Trụ sở chính" : "Chi nhánh con"}
                    </span>
                  </div>
                  {!isSelected && <Badge variant="active">Active</Badge>}
                </div>
                <CardTitle className="text-base font-bold mt-2.5 text-[var(--foreground)] leading-snug">
                  {branch.name}
                </CardTitle>
                <CardDescription className="flex items-start gap-1.5 text-xs text-[var(--muted-foreground)] pt-1 font-medium">
                  <MapPin className="size-3.5 shrink-0 mt-0.5 text-[var(--primary)]" />
                  <span>{branch.address}</span>
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-3 pt-1 text-xs">
                <div className="grid grid-cols-2 gap-2 rounded-xl bg-[var(--muted)] p-3 border border-[var(--border)]">
                  <div className="flex items-center gap-2.5">
                    <div className="flex size-8 items-center justify-center rounded-lg bg-sky-500/10 text-sky-600 dark:text-sky-400">
                      <ThermometerSnowflake className="size-4" />
                    </div>
                    <div>
                      <p className="text-[10px] text-[var(--muted-foreground)] font-medium">Nhiệt độ kho</p>
                      <p className="font-bold text-[var(--foreground)] text-xs">{branch.tempZone}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <div className="flex size-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                      <Users className="size-4" />
                    </div>
                    <div>
                      <p className="text-[10px] text-[var(--muted-foreground)] font-medium">Nhân sự</p>
                      <p className="font-bold text-[var(--foreground)] text-xs">{branch.membersCount} thành viên</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] text-[var(--muted-foreground)] px-1 font-medium">
                  <div className="flex items-center gap-1">
                    <Clock className="size-3" />
                    <span>Asia/Ho_Chi_Minh</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Coins className="size-3" />
                    <span>Tiền tệ: VND</span>
                  </div>
                </div>
              </CardContent>

              <CardFooter className="border-t border-[var(--border)] pt-3 pb-3 bg-[var(--muted)]/40">
                <Button
                  onClick={() => handleSelectBranch(branch.id)}
                  variant={isSelected ? "default" : "outline"}
                  className={`w-full h-8 text-xs font-bold rounded-xl gap-1.5 transition-all ${
                    isSelected
                      ? "bg-[#0284C7] hover:bg-[#0369A1] text-white shadow-sm"
                      : "border-[var(--border)] hover:bg-[var(--secondary)] text-[var(--foreground)]"
                  }`}
                >
                  <span>{isSelected ? "Đang chọn chi nhánh này" : "Chọn chi nhánh này"}</span>
                  <ArrowUpRight className="size-3.5" />
                </Button>
              </CardFooter>
            </Card>
          );
        })}
      </div>
    </main>
  );
}
