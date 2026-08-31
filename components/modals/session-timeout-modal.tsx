"use client";

import React, { useState } from "react";
import { Lock, LogIn, KeyRound } from "lucide-react";
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

interface SessionTimeoutModalProps {
  open: boolean;
  onOpenChange?: (open: boolean) => void;
  userName?: string;
  userEmail?: string;
  avatarInitials?: string;
  onUnlock?: (passwordOrPin: string) => Promise<void> | void;
  onLogout?: () => void;
}

export function SessionTimeoutModal({
  open,
  onOpenChange,
  userName = "Nguyễn Văn Quản",
  userEmail = "quan.nguyen@vietsach.vn",
  avatarInitials = "NV",
  onUnlock,
  onLogout,
}: SessionTimeoutModalProps) {
  const [pin, setPin] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pin) {
      setError("Vui lòng nhập mật khẩu hoặc mã PIN");
      return;
    }
    setLoading(true);
    setError("");
    try {
      if (onUnlock) {
        await onUnlock(pin);
      }
      setPin("");
      onOpenChange?.(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Mã xác thực không chính xác");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="sm" layer="session" showClose={false} className="bg-[var(--card)] text-center">
        <form onSubmit={handleUnlock}>
          <DialogHeader className="text-center items-center">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-500 mb-2">
              <Lock className="size-6" />
            </div>
            <DialogTitle className="text-lg font-bold">
              Phiên Làm Việc Đã Hết Hạn
            </DialogTitle>
            <DialogDescription className="text-center">
              Hệ thống tự động khoá sau thời gian không tương tác để bảo vệ dữ liệu.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 my-3 text-xs">
            {/* User Profile Tile */}
            <div className="p-3 rounded-xl bg-[var(--secondary)]/50 border border-[var(--border)] flex items-center gap-3">
              <div className="size-10 rounded-xl bg-gradient-to-tr from-[#0284C7] to-emerald-500 text-white font-bold flex items-center justify-center text-sm shadow-xs shrink-0">
                {avatarInitials}
              </div>
              <div className="text-left overflow-hidden">
                <div className="font-bold text-[var(--foreground)] truncate">{userName}</div>
                <div className="text-[11px] text-[var(--muted-foreground)] truncate">{userEmail}</div>
              </div>
            </div>

            {error && (
              <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs text-left">
                {error}
              </div>
            )}

            <div className="text-left">
              <Label className="text-xs font-semibold">Mật khẩu hoặc mã PIN 6 số</Label>
              <div className="relative mt-1">
                <KeyRound className="size-4 text-[var(--muted-foreground)] absolute left-3 top-2.5" />
                <Input
                  type="password"
                  required
                  autoFocus
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  placeholder="Nhập mã mở khóa..."
                  className="pl-9 text-xs"
                />
              </div>
            </div>
          </div>

          <DialogFooter className="flex-col gap-2 sm:flex-col sm:space-x-0 mt-4">
            <Button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold"
            >
              {loading ? "Đang xác thực..." : "Mở khóa tiếp tục"}
            </Button>

            <Button
              type="button"
              variant="ghost"
              onClick={onLogout}
              className="w-full text-xs text-[var(--muted-foreground)] hover:text-rose-600"
            >
              <LogIn className="size-3.5 mr-1" />
              Đăng nhập bằng tài khoản khác
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
