"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/patterns/confirm-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LoadingState, EmptyState, ErrorState } from "@/components/patterns/empty-state";
import { InlineAlert } from "@/components/patterns/inline-alert";
import { toast } from "@/components/ui/toast";
import { errorText } from "./access";
import { RequireAction, useAccess } from "@/lib/access-boundary";
import { PageHeading } from "@/components/patterns/page-heading";
import { PermissionGrid } from "./permission-grid";
import { actionChanges, catalogOf, replaceRole, resourcesOf, useRoleMatrix } from "./use-role-matrix";

type Props = { root: string; editable: boolean };

export function RoleMatrix({ root, editable }: Props) {
  const { data, error, isLoading, mutate } = useRoleMatrix(root);
  const [role, setRole] = useState("");
  const [draft, setDraft] = useState<string[]>([]);
  const [pending, setPending] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState("");
  const [done, setDone] = useState("");

  if (isLoading) return <LoadingState title="Đang tải ma trận quyền…" />;
  if (error || !data) return <ErrorState title={errorText(error, { 404: "Không tìm thấy ma trận quyền." })} onRetry={() => void mutate()} />;
  const roles = Object.keys(data).sort();
  if (roles.length === 0) return <EmptyState title="Chưa có role nào." />;

  const current = role && data[role] ? role : roles[0];
  const shown = current === role ? draft : data[current];
  const changes = actionChanges(data[current], shown);
  const dirty = changes.added.length > 0 || changes.removed.length > 0;
  const resources = resourcesOf(data);
  const catalog = catalogOf(data);

  function choose(code: string) {
    setRole(code);
    setDraft(data?.[code] ?? []);
    setFailure("");
    setDone("");
    setPending(null);
  }

  function toggle(key: string, on: boolean) {
    if (current !== role) setRole(current);
    setDone("");
    setDraft(on ? [...new Set([...shown, key])] : shown.filter((item) => item !== key));
  }

  async function save() {
    setBusy(true);
    setFailure("");
    try {
      await mutate(await replaceRole(root, current, shown), { revalidate: false });
      const msg = `Đã cập nhật quyền của ${current}.`;
      setDone(msg);
      toast.success(msg);
    } catch (failed) {
      const err = errorText(failed, {
        400: "Quyền không hợp lệ.",
        404: `Role ${current} không có trong danh mục.`,
      });
      setFailure(err);
      toast.error(err);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      {done && <InlineAlert tone="success">{done}</InlineAlert>}
      {failure && <InlineAlert>{failure}</InlineAlert>}
      {!editable && <InlineAlert tone="info">Chỉ xem. Cần quyền org:role:update để thay đổi ma trận.</InlineAlert>}

      <Tabs value={current} onValueChange={(code) => (dirty ? setPending(code) : choose(code))} className="space-y-4">
        <div className="space-y-1.5">
          <span className="text-xs font-medium text-muted-foreground">Role</span>
          <fieldset disabled={busy} className="min-w-0 border-0 p-0 disabled:opacity-60">
            <TabsList aria-label="Chọn role" className="h-auto max-w-full flex-wrap justify-start">
              {roles.map((code) => <TabsTrigger key={code} value={code}>{code}</TabsTrigger>)}
            </TabsList>
          </fieldset>
        </div>
        <TabsContent value={current}>
          <PermissionGrid actions={shown} resources={resources} catalog={catalog} disabled={!editable || busy} onToggle={toggle} />
        </TabsContent>
      </Tabs>

      {/* Sticky Save Bar when dirty */}
      {editable && dirty && (
        <div className="sticky bottom-0 z-20 -mx-4 -mb-4 mt-6 border-t border-border bg-card p-4 shadow-sm sm:-mx-6 sm:-mb-6 transition-transform duration-200 animate-[sheet-in_200ms_ease-out]">
          <div className="flex flex-wrap items-center justify-between gap-3 max-w-7xl mx-auto">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-foreground">Thay đổi chưa lưu</span>
              <span className="text-xs text-muted-foreground" aria-live="polite">
                Thêm {changes.added.length} · bỏ {changes.removed.length}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Button type="button" variant="outline" disabled={busy} onClick={() => choose(current)}>
                Huỷ
              </Button>
              <Button type="button" variant="default" disabled={!dirty || busy} onClick={() => void save()}>
                {busy ? "Đang lưu…" : "Lưu thay đổi"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {editable && !dirty && (
        <div className="flex items-center justify-between pt-2">
          <span className="text-xs text-muted-foreground">Thay đổi quyền bằng checkbox hoặc chip bên trên.</span>
        </div>
      )}

      <ConfirmDialog
        open={pending !== null}
        onOpenChange={(value) => !value && setPending(null)}
        title="Bỏ thay đổi chưa lưu?"
        description={`Role ${current} còn thay đổi chưa lưu. Chuyển sang ${pending ?? ""} sẽ mất các thay đổi này.`}
        confirmLabel="Bỏ và chuyển"
        danger
        onConfirm={() => pending && choose(pending)}
      />
    </div>
  );
}

export function RoleMatrixView() {
  const { root, can } = useAccess();
  return (
    <RequireAction action="org:role:update">
      <PageHeading title="Ma trận quyền" description="Quản lý quyền của từng role." />
      <p className="text-xs text-muted-foreground">Quyền chỉ quyết định bằng action trả về từ tổ chức.</p>
      <RoleMatrix root={root} editable={can("org:role:update")} />
    </RequireAction>
  );
}
