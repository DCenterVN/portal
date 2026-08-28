"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Snowflake, Building2, ShieldCheck, ArrowRight, ArrowLeft } from "lucide-react";
import { getProfile, switchOrg, UserProfile } from "../../lib/auth/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function SwitchOrgPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [submittingOrgId, setSubmittingOrgId] = useState<string | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    getProfile()
      .then((data) => {
        setProfile(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : String(err) || "Không thể tải danh sách tổ chức.");
        setLoading(false);
      });
  }, []);

  const handleSelectOrg = async (orgId: string, branchId?: string) => {
    setSubmittingOrgId(orgId);
    setError("");

    try {
      await switchOrg(orgId, branchId);
      router.push("/branches");
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err) || "Không thể chuyển tổ chức.");
      setSubmittingOrgId(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-[var(--background)]">
        <div className="text-center space-y-3">
          <div className="size-8 border-3 border-[var(--primary)] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-[var(--muted-foreground)]">Đang tải danh sách tổ chức và chi nhánh...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 sm:p-12 bg-[var(--background)]">
      <Card className="w-full max-w-xl border-[var(--border)] bg-[var(--card)] shadow-xl rounded-2xl p-6 sm:p-8">
        <CardHeader className="p-0 pb-6 text-center space-y-1.5">
          <div className="flex items-center justify-center gap-2 mb-1">
            <div className="size-8 rounded-xl bg-gradient-to-tr from-[#0284C7] to-emerald-500 text-white flex items-center justify-center shadow-md">
              <Snowflake className="size-4" />
            </div>
            <span className="font-serif text-lg font-bold text-[var(--foreground)]">Việt Sạch</span>
          </div>
          <CardTitle className="font-serif text-2xl font-bold text-[var(--foreground)]">Chọn Không Gian Làm Việc</CardTitle>
          <CardDescription className="text-xs text-[var(--muted-foreground)]">
            Chọn tổ chức hoặc chi nhánh bạn muốn đăng nhập để thực hiện tác vụ
          </CardDescription>
        </CardHeader>

        <CardContent className="p-0">
          {error && (
            <div
              role="alert"
              aria-live="polite"
              className="mb-5 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-700 dark:text-rose-400 text-xs flex items-center gap-2.5"
            >
              <ShieldCheck className="size-4 shrink-0 text-rose-500" />
              <span>{error}</span>
            </div>
          )}

          {profile && profile.memberships && profile.memberships.length > 0 ? (
            <div className="space-y-3">
              {profile.memberships.map((m, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-xl border border-[var(--border)] bg-[var(--secondary)]/30 hover:bg-[var(--secondary)]/50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Building2 className="size-4 text-[var(--primary)] shrink-0" />
                      <h4 className="text-sm font-bold text-[var(--foreground)]">{m.org_name || m.org_id}</h4>
                    </div>
                    {m.branch_name && (
                      <p className="text-xs text-[var(--muted-foreground)]">Chi nhánh: {m.branch_name}</p>
                    )}
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {m.roles.map((r) => (
                        <Badge key={r} variant="secondary" className="text-[10px] font-bold">
                          {r}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <Button
                    type="button"
                    size="sm"
                    className="text-xs font-bold rounded-xl shrink-0"
                    onClick={() => handleSelectOrg(m.org_id, m.branch_id)}
                    disabled={submittingOrgId === m.org_id}
                  >
                    {submittingOrgId === m.org_id ? (
                      <span className="flex items-center gap-1.5">
                        <span className="size-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Đang vào...
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5">
                        Truy cập <ArrowRight className="size-3" />
                      </span>
                    )}
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-xs text-[var(--muted-foreground)] border border-dashed border-[var(--border)] rounded-xl">
              Bạn chưa có phân quyền tại tổ chức nào. Đang hoạt động dưới quyền Khách hàng vãng lai (CUSTOMER).
            </div>
          )}

          <div className="mt-6 pt-5 border-t border-[var(--border)] text-center">
            <Link
              href="/branches"
              className="inline-flex items-center gap-1 text-xs text-[var(--muted-foreground)] hover:text-[var(--primary)] font-medium"
            >
              <ArrowLeft className="size-3.5" /> Quay lại Bảng điều khiển
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
