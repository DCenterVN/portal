"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, ShieldCheck, Store } from "lucide-react";
import { getProfile, switchBranch, type UserProfile } from "@/lib/auth/client";
import { AuthHeading } from "@/components/patterns/auth-heading";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export function SwitchBranchPage() {
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
        setError(err instanceof Error ? err.message : String(err) || "Không thể tải danh sách chi nhánh.");
        setLoading(false);
      });
  }, []);

  const handleSelectBranch = async (orgId: string, branchId?: string) => {
    setSubmittingOrgId(orgId);
    setError("");

    try {
      await switchBranch(orgId, branchId);
      router.push("/branches");
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err) || "Không thể chuyển chi nhánh.");
      setSubmittingOrgId(null);
    }
  };

  if (loading) {
    return (
      <div role="status" className="flex flex-col items-center gap-3 py-8 text-center">
        <span className="size-8 animate-spin rounded-full border-2 border-[var(--primary)] border-t-transparent" />
        <p className="text-sm text-[var(--muted-foreground)]">Đang tải danh sách chi nhánh làm việc...</p>
      </div>
    );
  }

  return (
    <>
      <AuthHeading
        title="Chọn Chi Nhánh Vận Hành"
        subtitle="Chọn không gian làm việc hoặc chi nhánh bạn muốn đăng nhập để thực hiện tác vụ"
      />

      {error && (
        <div
          role="alert"
          aria-live="polite"
          className="mb-4 flex items-center gap-2 rounded-md border border-[var(--destructive)]/20 bg-[var(--destructive)]/10 p-3 text-sm text-[var(--destructive)]"
        >
          <ShieldCheck className="size-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {profile?.memberships?.length ? (
        <div className="space-y-3">
          {profile.memberships.map((membership, index) => (
            <div
              key={`${membership.org_id}-${membership.branch_id ?? index}`}
              className="flex flex-col justify-between gap-3 rounded-lg border border-[var(--border)] bg-[var(--tint)] p-4 transition-colors hover:border-[var(--input)] sm:flex-row sm:items-center"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Store className="size-4 shrink-0 text-[var(--primary)]" />
                  <h2 className="text-sm font-bold text-[var(--foreground)]">
                    {membership.branch_name || membership.org_name || membership.org_id}
                  </h2>
                </div>
                {membership.branch_name && membership.org_name && (
                  <p className="text-xs text-[var(--muted-foreground)]">Tổ chức: {membership.org_name}</p>
                )}
                <div className="mt-1 flex flex-wrap gap-1">
                  {membership.roles.map((role) => (
                    <Badge key={role} variant="secondary" className="text-xs font-bold">
                      {role}
                    </Badge>
                  ))}
                </div>
              </div>

              <Button
                type="button"
                size="sm"
                onClick={() => handleSelectBranch(membership.org_id, membership.branch_id)}
                disabled={submittingOrgId === membership.org_id}
              >
                {submittingOrgId === membership.org_id ? (
                  <span className="flex items-center gap-1.5">
                    <span className="size-3 animate-spin rounded-full border-2 border-[var(--primary-foreground)] border-t-transparent" />
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
        <div className="rounded-lg border border-dashed border-[var(--border)] py-8 text-center text-sm text-[var(--muted-foreground)]">
          Bạn chưa có phân quyền tại chi nhánh nào. Đang hoạt động dưới quyền Khách hàng vãng lai (CUSTOMER).
        </div>
      )}

      <div className="mt-5 border-t border-[var(--border)] pt-4 text-center">
        <Link
          href="/branches"
          className="inline-flex items-center gap-1 text-sm font-medium text-[var(--muted-foreground)] transition-colors hover:text-[var(--primary)]"
        >
          <ArrowLeft className="size-4" /> Quay lại Danh sách Chi nhánh
        </Link>
      </div>
    </>
  );
}
