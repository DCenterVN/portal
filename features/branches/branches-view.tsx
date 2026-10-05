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
import { PageShell, PageHeader } from "@/components/ui/page";

interface BranchInfo {
  id: string;
  name: string;
  code: string;
  address: string;
  type: string;
  tempZone: string;
  membersCount: number;
}

interface BranchesViewProps {
  initialBranches: BranchInfo[];
}

export function BranchesView({ initialBranches }: BranchesViewProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const safeBranches = initialBranches ?? [];
  const [activeBranchId, setActiveBranchId] = useState(safeBranches[0]?.id ?? "");

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
    <PageShell className="bg-[var(--color-bg)] text-[var(--color-ink)]">
      <PageHeader
        icon={<Building2 />}
        title="Danh sách Chi nhánh Vận hành"
        badge={
          <Badge variant="secondary" dot={false} className="text-xs font-bold px-2.5 py-0.5 rounded-full">
            {safeBranches.length} Chi nhánh
          </Badge>
        }
        description="Chọn chi nhánh cấp đông để chuyển đổi ngữ cảnh làm việc, quản lý kho hàng và nhân sự"
        actions={
          <>
            <div className="relative w-64 sm:w-80">
              <Search className="absolute left-3 top-3.5 size-3.5 text-[var(--color-muted)]" />
              <Input
                placeholder="Tìm mã hoặc tên chi nhánh..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 text-xs h-11 rounded-[var(--radius-md)] bg-[var(--color-surface)] text-[var(--color-ink)] border-[var(--color-input-border)]"
              />
            </div>
            <Button size="sm">
              <Plus className="size-3.5" />
              <span>Thêm Chi Nhánh</span>
            </Button>
          </>
        }
      />

      {/* Branches Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-6">
        {filteredBranches.map((branch) => {
          const isSelected = activeBranchId === branch.id;
          return (
            <Card
              key={branch.id}
              className={`relative flex flex-col justify-between transition-all rounded-2xl border bg-[var(--color-surface)] text-[var(--color-ink)] overflow-hidden ${
                isSelected
                  ? "border-[var(--color-primary)] shadow-[var(--elevation-shadow-card)] ring-2 ring-[var(--color-focus)]"
                  : "border-[var(--color-line)] hover:border-[var(--color-input-border)] hover:shadow-[var(--elevation-shadow-card)]"
              }`}
            >
              {/* Selected Pill Header */}
              {isSelected && (
                <div className="absolute top-3 right-4 z-10">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--color-tint)] px-3 py-0.5 text-[11px] font-bold text-[var(--color-ink)] shadow-[var(--elevation-shadow-card)]">
                    <CheckCircle2 className="size-3 text-[var(--color-leaf)]" /> Đang vận hành
                  </span>
                </div>
              )}

              <CardHeader className="pb-3 pt-5">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-lg bg-[var(--color-tint)] text-[var(--color-ink)] border border-[var(--color-line)]">
                      {branch.code}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[var(--color-tint)] text-[var(--color-ink)] border border-[var(--color-line)]">
                      {branch.type === "MAIN" ? "Trụ sở chính" : "Chi nhánh con"}
                    </span>
                  </div>
                  {!isSelected && <Badge variant="active">Active</Badge>}
                </div>
                <CardTitle className="font-[family-name:var(--font-quicksand,var(--font-display))] text-base font-bold mt-2.5 text-[var(--color-ink)] leading-snug">
                  {branch.name}
                </CardTitle>
                <CardDescription className="flex items-start gap-1.5 text-xs text-[var(--color-muted)] pt-1 font-medium">
                  <MapPin className="size-3.5 shrink-0 mt-0.5 text-[var(--color-primary)]" />
                  <span>{branch.address}</span>
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-3 pt-1 text-xs">
                <div className="grid grid-cols-2 gap-2 rounded-xl bg-[var(--color-tint)] p-3 border border-[var(--color-line)]">
                  <div className="flex items-center gap-2.5">
                    <div className="flex size-8 items-center justify-center rounded-lg bg-[var(--color-surface)] text-[var(--color-info)]">
                      <ThermometerSnowflake className="size-4" />
                    </div>
                    <div>
                      <p className="text-[10px] text-[var(--color-muted)] font-medium">Nhiệt độ kho</p>
                      <p className="font-bold text-[var(--color-ink)] text-xs">{branch.tempZone}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <div className="flex size-8 items-center justify-center rounded-lg bg-[var(--color-surface)] text-[var(--color-muted)]">
                      <Users className="size-4" />
                    </div>
                    <div>
                      <p className="text-[10px] text-[var(--color-muted)] font-medium">Nhân sự</p>
                      <p className="font-bold text-[var(--color-ink)] text-xs">{branch.membersCount} thành viên</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] text-[var(--color-muted)] px-1 font-medium">
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

              <CardFooter className="border-t border-[var(--color-line)] pt-3 pb-3 bg-[var(--color-tint)]">
                <Button
                  onClick={() => handleSelectBranch(branch.id)}
                  variant={isSelected ? "default" : "outline"}
                  className="w-full"
                >
                  <span>{isSelected ? "Đang chọn chi nhánh này" : "Chọn chi nhánh này"}</span>
                  <ArrowUpRight className="size-3.5" />
                </Button>
              </CardFooter>
            </Card>
          );
        })}
      </div>
    </PageShell>
  );
}
