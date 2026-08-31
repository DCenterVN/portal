"use client";

import React, { useState } from "react";
import { UserPlus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface InviteMemberModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  branchName?: string;
  onInvite?: (data: { fullName: string; email: string; phone: string; role: string; department: string }) => void;
}

export function InviteMemberModal({
  open,
  onOpenChange,
  branchName = "Chi nhánh Quận 7 — Kho Lạnh Tân Thuận",
  onInvite,
}: InviteMemberModalProps) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState("VT-02");
  const [department, setDepartment] = useState("Bộ phận Kho Vận & Kiểm Định");

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    onInvite?.({
      fullName,
      email,
      phone,
      role,
      department,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="md" className="bg-[var(--card)]">
        <form onSubmit={handleSend}>
          <DialogHeader>
            <div className="flex items-center gap-2.5 text-[var(--primary)] mb-1">
              <div className="flex size-9 items-center justify-center rounded-xl bg-sky-500/10 shrink-0">
                <UserPlus className="size-5" />
              </div>
              <div>
                <DialogTitle className="text-lg font-bold">
                  Thêm thành viên vào Chi nhánh
                </DialogTitle>
                <DialogDescription>
                  Gửi lời mời tham gia quản trị hoặc vận hành tại {branchName}.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-3.5 my-2 text-xs">
            <div>
              <Label className="text-xs font-semibold">Họ và tên</Label>
              <Input
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Ví dụ: Trần Văn Bình"
                className="mt-1 text-xs"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-semibold">Email doanh nghiệp</Label>
                <Input
                  required
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="binh.tran@vietsach.vn"
                  className="mt-1 text-xs"
                />
              </div>

              <div>
                <Label className="text-xs font-semibold">Số điện thoại (+84)</Label>
                <Input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="0988 123 456"
                  className="mt-1 text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-semibold">Vai trò chức danh</Label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-xs text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
                >
                  <option value="VT-01">VT-01 · Quản trị viên chi nhánh</option>
                  <option value="VT-02">VT-02 · Quản lý kho cấp đông</option>
                  <option value="VT-10">VT-10 · Nhân viên kiểm nhận kho</option>
                  <option value="VT-23">VT-23 · Chuyên viên kiểm định QC</option>
                  <option value="VT-30">VT-30 · Nhân viên điều phối giao vận</option>
                </select>
              </div>

              <div>
                <Label className="text-xs font-semibold">Bộ phận trực thuộc</Label>
                <Input
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="mt-1 text-xs"
                />
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="rounded-xl border-[var(--border)] text-xs font-semibold"
            >
              Huỷ
            </Button>

            <Button
              type="submit"
              className="rounded-xl bg-[var(--primary)] hover:bg-[var(--primary)]/90 text-white text-xs font-bold"
            >
              Gửi lời mời
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
