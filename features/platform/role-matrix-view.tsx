"use client";

import { useState } from "react";
import { KeyRound } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/dialog";
import { Field, Textarea } from "@/components/ui/field";
import { Skeleton, EmptyState, ErrorState, InlineAlert } from "@/components/ui/state";
import { errorText } from "./access";
import { RequireAction, useAccess } from "./access-boundary";
import { CompanyHeader, CompanyTabs } from "./company-detail-view";
import type { Source } from "./use-company";
import { actionChanges, parseActions, useRoleMatrix, replaceRole } from "./use-role-matrix";

type Props = { source: Source; root: string; editable: boolean };

export function RoleMatrix({ source, root, editable }: Props) {
  const { data, error, isLoading, mutate } = useRoleMatrix(source, root);
  const [role, setRole] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState("");
  const [done, setDone] = useState("");

  if (isLoading) return <Skeleton title="Đang tải ma trận quyền…" />;
  if (error || !data) return <ErrorState title={errorText(error, { 404: "Không tìm thấy công ty này." })} onRetry={() => void mutate()} />;
  const roles = Object.keys(data).sort();
  if (roles.length === 0) return <EmptyState title="Công ty chưa có role nào." />;

  const before = role ? data[role] ?? [] : [];
  const changes = actionChanges(before, parseActions(draft));

  function open(code: string) {
    setRole(code);
    setDraft((data?.[code] ?? []).join("\n"));
    setFailure("");
    setDone("");
  }

  async function save() {
    if (!role) return;
    setBusy(true);
    setFailure("");
    try {
      await mutate(await replaceRole(root, role, parseActions(draft)), { revalidate: false });
      setDone(`Đã cập nhật ${role} cho mọi chi nhánh của công ty.`);
      setRole(null);
    } catch (failed) {
      // Draft is kept on failure so nothing typed is lost.
      setFailure(errorText(failed, { 400: "Có action thuộc module công ty chưa mua, hoặc action không hợp lệ.", 404: `Role ${role} không có trong danh mục.` }));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      {done && <InlineAlert tone="success">{done}</InlineAlert>}
      {!editable && <InlineAlert tone="info">Chỉ xem. Ma trận quyền do quản trị nền tảng thay đổi.</InlineAlert>}
      <div className="grid gap-4 md:grid-cols-2">
        {roles.map((code) => (
          <Card key={code}>
            <CardHeader className="flex-row items-start justify-between gap-3 space-y-0 pb-3">
              <div className="space-y-1">
                <CardTitle className="font-mono text-base">{code}</CardTitle>
                <CardDescription>{data[code].length} action</CardDescription>
              </div>
              {editable && (
                <Button variant="outline" size="touch" onClick={() => open(code)} aria-label={`Sửa quyền của ${code}`}>
                  Sửa
                </Button>
              )}
            </CardHeader>
            <CardContent className="flex flex-wrap gap-1.5">
              {data[code].length === 0 ? (
                <span className="text-xs text-[var(--muted-foreground)]">Không có action.</span>
              ) : (
                data[code].map((action) => (
                  <Badge key={action} variant="outline" dot={false} className="font-mono font-medium">
                    {action}
                  </Badge>
                ))
              )}
            </CardContent>
          </Card>
        ))}
      </div>
      <ConfirmDialog
        open={Boolean(role)}
        onOpenChange={(value) => !value && setRole(null)}
        title={`Thay toàn bộ quyền của ${role ?? ""}`}
        description="Áp dụng cho mọi chi nhánh của công ty này, công ty khác không đổi. Thay đổi được ghi audit."
        confirmLabel="Lưu ma trận"
        busy={busy}
        confirmDisabled={changes.added.length === 0 && changes.removed.length === 0}
        onConfirm={() => void save()}
      >
        <div className="grid gap-3">
          <Field label="Action, mỗi dòng một action" htmlFor="role-actions">
            <Textarea id="role-actions" rows={10} value={draft} onChange={(event) => setDraft(event.target.value)} disabled={busy} className="font-mono text-xs" />
          </Field>
          <p className="text-xs text-[var(--muted-foreground)]" aria-live="polite">
            Thêm {changes.added.length} · bỏ {changes.removed.length}
          </p>
          {failure && <InlineAlert>{failure}</InlineAlert>}
        </div>
      </ConfirmDialog>
    </div>
  );
}

export function RoleMatrixView({ root }: { root: string }) {
  const { can } = useAccess();
  return (
    <RequireAction action="platform:role_matrix:read">
      <CompanyHeader root={root} title="Ma trận quyền" />
      <CompanyTabs root={root} />
      <div className="flex items-center gap-2 text-xs text-[var(--muted-foreground)]">
        <KeyRound className="size-4" aria-hidden="true" /> Quyền chỉ quyết định bằng action trả về từ tổ chức.
      </div>
      <RoleMatrix source="platform" root={root} editable={can("platform:role_matrix:update")} />
    </RequireAction>
  );
}
