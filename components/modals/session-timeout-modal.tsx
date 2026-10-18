"use client";

import React, { useId, useState } from "react";
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
import { PasswordInput } from "@/components/patterns/password-input";
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
  userName = "Tài khoản",
  userEmail = "",
  avatarInitials = "TK",
  onUnlock,
  onLogout,
}: SessionTimeoutModalProps) {
  const pinId = useId();
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
      <DialogContent size="sm" layer="session" showClose={false} className="bg-[var(--color-surface)] text-center">
        <form onSubmit={handleUnlock}>
          <DialogHeader className="text-center items-center">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-[var(--color-tint)] text-[var(--color-warn-ink)] mb-2">
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
            <div className="p-3 rounded-xl bg-[var(--color-tint)] border border-[var(--color-line)] flex items-center gap-3">
              <div className="size-10 rounded-xl bg-[var(--color-tint)] text-[var(--color-ink)] font-bold flex items-center justify-center text-sm shadow-[var(--elevation-shadow-card)] shrink-0">
                {avatarInitials}
              </div>
              <div className="text-left overflow-hidden">
                <div className="font-bold text-[var(--color-ink)] truncate">{userName}</div>
                <div className="text-[11px] text-[var(--color-muted)] truncate">{userEmail}</div>
              </div>
            </div>

            {error && (
              <div className="p-2.5 rounded-xl bg-[var(--color-tint)] border border-[var(--color-danger)] text-[var(--color-danger)] text-xs text-left">
                {error}
              </div>
            )}

            <div className="text-left">
              <Label htmlFor={pinId} className="text-xs font-semibold">Mật khẩu hoặc mã PIN 6 số</Label>
              <div className="relative mt-1">
                <KeyRound className="size-4 text-[var(--color-muted)] absolute left-3 top-2.5" />
                <PasswordInput
                  id={pinId}
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
              variant="default"
              size="default"
              className="w-full"
            >
              {loading ? "Đang xác thực..." : "Mở khóa tiếp tục"}
            </Button>

            <Button
              type="button"
              variant="ghost"
              onClick={onLogout}
              className="w-full text-xs text-[var(--muted-foreground)]"
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
