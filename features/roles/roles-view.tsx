"use client";

import { useState } from "react";
import { Lock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageShell } from "@/components/ui/page";
import { PageHeading } from "@/components/patterns/page-heading";
import { ConfirmDialog } from "@/components/patterns/confirm-dialog";
import { ErrorState, LoadingState } from "@/components/patterns/empty-state";
import { InlineAlert } from "@/components/patterns/inline-alert";
import { toast } from "@/components/ui/toast";
import { RequireAction, useAccess } from "@/lib/access-boundary";
import { catalogRoleName } from "@/lib/role-catalog";
import { cn } from "@/lib/utils";
import { errorText } from "@/features/platform/access";
import { actionChanges, catalogOf, replaceRole, useRoleMatrix } from "@/features/platform/use-role-matrix";
import { HoldersPanel } from "./holders-panel";
import { PermissionPanel } from "./permission-panel";
import { countHolders } from "@/features/memberships/people";
import { useMemberships, useRoleCatalog } from "./use-roles";

export function RolesView() {
  const { root, can } = useAccess();
  const editable = can("org:role:update");
  const { data, error, isLoading, mutate } = useRoleMatrix(root);
  const members = useMemberships(can("org:membership:read"));
  const catalogQuery = useRoleCatalog(can("org:role:read"));
  const catalog = catalogQuery.data;
  const roleName = (code: string) => catalogRoleName(catalog, code);
  const order = catalog?.map((item) => item.code) ?? [];
  const [role, setRole] = useState("");
  const [draft, setDraft] = useState<string[]>([]);
  const [target, setTarget] = useState<string | null>(null);
  const [confirmSave, setConfirmSave] = useState(false);
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState("");

  const roles = data ? [...order.filter((code) => code in data), ...Object.keys(data).filter((code) => !order.includes(code)).sort()] : [];
  const current = role && data?.[role] ? role : roles[0] ?? "";
  const shown = current === role ? draft : data?.[current] ?? [];
  const changes = data ? actionChanges(data[current] ?? [], shown) : { added: [], removed: [] };
  const count = changes.added.length + changes.removed.length;
  const dropsAdminOrg = catalog?.find((item) => item.code === current)?.protected && changes.removed.some((key) => key.startsWith("org:"));

  function choose(code: string) {
    setRole(code);
    setDraft(data?.[code] ?? []);
    setFailure("");
    setTarget(null);
  }

  function change(next: string[]) {
    setRole(current);
    setDraft(next);
  }

  async function save() {
    setBusy(true);
    setFailure("");
    try {
      await mutate(await replaceRole(root, current, shown), { revalidate: false });
      toast.success(`Đã lưu quyền của ${roleName(current)}.`);
      setConfirmSave(false);
    } catch (failed) {
      const text = errorText(failed, { 400: "Quyền không hợp lệ.", 404: "Vai trò này không còn trong danh mục." });
      setFailure(text);
      toast.error(text);
    } finally {
      setBusy(false);
    }
  }

  return (
    <RequireAction action="org:company:read">
      <PageShell className="space-y-4">
        <PageHeading title="Vai trò & quyền" description="Mỗi vai trò làm được những việc nào. Chọn vai trò bên trái, chỉnh quyền bên phải." />
        {!editable && <InlineAlert tone="info">Bạn chỉ được xem. Chỉ quản trị viên mới sửa được quyền.</InlineAlert>}
        {failure && <InlineAlert>{failure}</InlineAlert>}
        {isLoading ? <LoadingState title="Đang tải vai trò và quyền…" />
          : error || !data ? <ErrorState title={errorText(error, { 404: "Không tìm thấy ma trận quyền." })} onRetry={() => void mutate()} />
          : (
            <div className="grid gap-4 md:grid-cols-[18rem_minmax(0,1fr)]">
              <RadioGroup aria-label="Vai trò" value={current} disabled={busy} onValueChange={(code) => (count > 0 ? setTarget(code) : choose(code))} className="content-start gap-2">
                {roles.map((code) => (
                  <label key={code} className={cn("flex cursor-pointer items-start gap-3 rounded-xl border border-border bg-card p-3 transition-colors hover:bg-muted", code === current && "border-primary ring-1 ring-primary")}>
                    <RadioGroupItem value={code} className="mt-1" />
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center justify-between gap-2">
                        <span className="inline-flex items-center gap-2 font-medium">
                          {roleName(code)}
                          {catalog?.find((item) => item.code === code)?.protected && <Lock className="size-4 shrink-0 text-muted-foreground" aria-label="Vai trò được bảo vệ" />}
                        </span>
                        <Badge variant="secondary">{members.data ? `${countHolders(members.data, code)} người` : "…"}</Badge>
                      </span>
                      <span className="mt-1 block text-xs text-muted-foreground">{catalog?.find((item) => item.code === code)?.description}</span>
                    </span>
                  </label>
                ))}
              </RadioGroup>
              <Tabs defaultValue="permissions" className="min-w-0 space-y-3">
                <TabsList>
                  <TabsTrigger value="permissions">Quyền</TabsTrigger>
                  <TabsTrigger value="holders">Ai đang giữ</TabsTrigger>
                </TabsList>
                <TabsContent value="permissions">
                  <PermissionPanel catalog={[...catalogOf(data)]} draft={shown} editable={editable && !busy} onChange={change} />
                </TabsContent>
                <TabsContent value="holders">
                  <HoldersPanel role={current} members={members.data} error={!!members.error} loading={members.isLoading} onRetry={() => void members.mutate()} nameOf={roleName} />
                </TabsContent>
              </Tabs>
            </div>
          )}
        {editable && count > 0 && (
          <div className="sticky bottom-0 z-(--z-sheet) -mx-4 border-t border-border bg-card px-4 py-3 shadow-sm sm:-mx-6 sm:px-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span className="text-sm font-semibold" aria-live="polite">{count} thay đổi <span className="font-normal text-muted-foreground">· {roleName(current)}</span></span>
              <div className="flex gap-2">
                <Button type="button" variant="outline" disabled={busy} onClick={() => choose(current)}>Huỷ</Button>
                <Button type="button" disabled={busy} onClick={() => (dropsAdminOrg ? setConfirmSave(true) : void save())}>{busy ? "Đang lưu…" : "Lưu"}</Button>
              </div>
            </div>
          </div>
        )}
        <ConfirmDialog
          open={target !== null}
          onOpenChange={(open) => !open && setTarget(null)}
          title="Bỏ thay đổi chưa lưu?"
          description={`${roleName(current)} còn ${count} thay đổi chưa lưu. Chuyển sang vai trò khác sẽ mất các thay đổi này.`}
          confirmLabel="Bỏ và chuyển"
          danger
          onConfirm={() => target && choose(target)}
        />
        <ConfirmDialog
          open={confirmSave}
          onOpenChange={setConfirmSave}
          title="Bỏ quyền quản trị của Quản trị hệ thống?"
          description="Quyền thuộc nhóm Tổ chức quyết định ai quản lý được nhân viên và vai trò. Bỏ đi có thể khiến không ai chỉnh được quyền nữa."
          confirmLabel="Vẫn lưu"
          danger
          busy={busy}
          onConfirm={() => void save()}
        />
      </PageShell>
    </RequireAction>
  );
}
