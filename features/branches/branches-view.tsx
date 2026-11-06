"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/patterns/status-badge";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { PageShell } from "@/components/ui/page";
import { PageHeading } from "@/components/patterns/page-heading";

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
    <PageShell className="bg-background text-foreground">
      <PageHeading
        title="Danh sách Chi nhánh Vận hành"
        badge={
          <Badge variant="outline">
            {safeBranches.length} Chi nhánh
          </Badge>
        }
        description="Chọn chi nhánh cấp đông để chuyển đổi ngữ cảnh làm việc, quản lý kho hàng và nhân sự"
        actions={
          <>
            <InputGroup className="w-64 sm:w-80">
              <InputGroupAddon><Search aria-hidden="true" /></InputGroupAddon>
              <InputGroupInput placeholder="Tìm mã hoặc tên chi nhánh..." value={search} onChange={(e) => setSearch(e.target.value)} aria-label="Tìm chi nhánh" />
            </InputGroup>
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
              className={`relative flex flex-col justify-between transition-all border bg-card text-foreground overflow-hidden ${
                isSelected
                  ? "border-primary"
                  : "border-border hover:border-input"
              }`}
            >
              {/* Selected Pill Header */}
              {isSelected && (
                <div className="absolute top-3 right-4 z-10">
                  <Badge variant="outline">Đang vận hành</Badge>
                </div>
              )}

              <CardHeader className="pb-3 pt-5">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="font-mono">
                      {branch.code}
                    </Badge>
                    <Badge variant="outline">
                      {branch.type === "MAIN" ? "Trụ sở chính" : "Chi nhánh con"}
                    </Badge>
                  </div>
                  {!isSelected && <StatusBadge tone="success">Active</StatusBadge>}
                </div>
                <CardTitle className="text-base font-semibold mt-2.5 text-foreground leading-snug">
                  {branch.name}
                </CardTitle>
                <CardDescription className="flex items-start gap-1.5 text-xs text-muted-foreground pt-1 font-medium">
                  <span>{branch.address}</span>
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-3 pt-1 text-xs">
                <div className="grid grid-cols-2 gap-2 rounded-lg bg-muted p-3 border border-border">
                  <div className="flex items-center gap-2.5">
                    <div>
                      <p className="text-xs text-muted-foreground font-medium">Nhiệt độ kho</p>
                      <p className="font-semibold text-foreground text-xs">{branch.tempZone}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <div>
                      <p className="text-xs text-muted-foreground font-medium">Nhân sự</p>
                      <p className="font-semibold text-foreground text-xs">{branch.membersCount} thành viên</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-muted-foreground px-1 font-medium">
                  <span>Asia/Ho_Chi_Minh</span>
                  <span>Tiền tệ: VND</span>
                </div>
              </CardContent>

              <CardFooter className="border-t border-border pt-3 pb-3 bg-muted">
                <Button
                  onClick={() => handleSelectBranch(branch.id)}
                  variant={isSelected ? "default" : "outline"}
                  className="w-full"
                >
                  <span>{isSelected ? "Đang chọn chi nhánh này" : "Chọn chi nhánh này"}</span>
                </Button>
              </CardFooter>
            </Card>
          );
        })}
      </div>
    </PageShell>
  );
}
