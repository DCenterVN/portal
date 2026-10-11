"use client";

import { useState } from "react";
import { KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ConfirmDialog } from "@/components/ui/dialog";
import { Segmented } from "@/components/ui/segmented";
import { Skeleton, EmptyState, ErrorState, InlineAlert } from "@/components/ui/state";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/components/ui/toast";
import { errorText } from "./access";
import { RequireAction, useAccess } from "./access-boundary";
import { CompanyHeader, CompanyTabs } from "./company-detail-view";
import type { Source } from "./use-company";
import { actionChanges, replaceRole, resourcesOf, useRoleMatrix, VERBS } from "./use-role-matrix";

type Props = { source: Source; root: string; editable: boolean };

export function RoleMatrix({ source, root, editable }: Props) {
  const { data, error, isLoading, mutate } = useRoleMatrix(source, root);
  const { toast } = useToast();
  const [role, setRole] = useState("");
  const [draft, setDraft] = useState<string[]>([]);
  const [pending, setPending] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState("");
  const [done, setDone] = useState("");

  if (isLoading) return <Skeleton title="Đang tải ma trận quyền…" />;
  if (error || !data) return <ErrorState title={errorText(error, { 404: "Không tìm thấy công ty này." })} onRetry={() => void mutate()} />;
  const roles = Object.keys(data).sort();
  if (roles.length === 0) return <EmptyState title="Công ty chưa có role nào." />;

  const current = role && data[role] ? role : roles[0];
  const shown = current === role ? draft : data[current];
  const changes = actionChanges(data[current], shown);
  const dirty = changes.added.length > 0 || changes.removed.length > 0;
  const resources = resourcesOf(data);

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
      const msg = `Đã cập nhật ${current} cho mọi chi nhánh của công ty.`;
      setDone(msg);
      toast.success(msg);
    } catch (failed) {
      const err = errorText(failed, {
        400: "Có action thuộc module công ty chưa mua, hoặc action không hợp lệ.",
        404: `Role ${current} không có trong danh mục.`,
      });
      setFailure(err);
      toast.error(err);
    } finally {
      setBusy(false);
    }
  }

  function getOtherActions(resource: string): string[] {
    return shown.filter(
      (act) => act.startsWith(`${resource}:`) && !(VERBS as readonly string[]).includes(act.slice(resource.length + 1))
    );
  }

  return (
    <div className="space-y-4">
      {done && <InlineAlert tone="success">{done}</InlineAlert>}
      {failure && <InlineAlert>{failure}</InlineAlert>}
      {!editable && <InlineAlert tone="info">Chỉ xem. Ma trận quyền do quản trị nền tảng thay đổi.</InlineAlert>}

      <div className="space-y-1.5">
        <span className="text-xs font-bold uppercase tracking-wider text-fg-3">Role</span>
        <Segmented
          label="Chọn role"
          items={roles.map((code) => ({ id: code, label: code }))}
          value={current}
          onChange={(code) => (dirty ? setPending(code) : choose(code))}
          className="flex flex-wrap gap-1 max-w-full"
        />
      </div>

      {/* Desktop Table: visible on md and larger */}
      <div className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-1/3">Tài nguyên</TableHead>
              {VERBS.map((verb) => (
                <TableHead key={verb} className="text-center font-bold uppercase" title={verb}>
                  {verb[0].toUpperCase()}
                </TableHead>
              ))}
              <TableHead className="text-center font-bold">Khác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {resources.map((resource) => {
              const otherActions = getOtherActions(resource);
              return (
                <TableRow key={resource} className="transition-colors duration-100 hover:bg-l1-2">
                  <TableCell className="whitespace-nowrap font-mono text-xs font-medium text-fg">{resource}</TableCell>
                  {VERBS.map((verb) => {
                    const key = `${resource}:${verb}`;
                    return (
                      <TableCell key={verb} className="text-center">
                        <Checkbox
                          checked={shown.includes(key)}
                          disabled={!editable || busy}
                          onCheckedChange={(on) => toggle(key, on)}
                          aria-label={key}
                          className="justify-center transition-colors duration-100"
                        />
                      </TableCell>
                    );
                  })}
                  <TableCell className="text-center">
                    {otherActions.length > 0 ? (
                      <div className="flex flex-wrap justify-center gap-1">
                        {otherActions.map((act) => (
                          <span
                            key={act}
                            className="inline-flex items-center px-1.5 py-0.5 rounded-[var(--r-2)] text-[11px] font-mono bg-l1-2 text-fg-2 border border-line"
                            title={act}
                          >
                            {act.slice(resource.length + 1)}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-xs text-fg-3">—</span>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Mobile 390: không cuộn ngang, mỗi tài nguyên 1 hàng 6 chip CRUDIE bấm được */}
      <div className="md:hidden space-y-2.5">
        <div className="flex items-center justify-between text-xs text-fg-3 px-1">
          <span>Tài nguyên</span>
          <span className="font-mono">C · R · U · D · I · E</span>
        </div>
        {resources.map((resource) => {
          const otherActions = getOtherActions(resource);
          return (
            <div key={resource} className="rounded-lg border border-line bg-l1 p-3 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-xs font-bold text-fg break-all">{resource}</span>
                {otherActions.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {otherActions.map((act) => (
                      <span
                        key={act}
                        className="inline-flex items-center px-1.5 py-0.5 rounded-[var(--r-2)] text-[11px] font-mono bg-l1-2 text-fg-2 border border-line"
                        title={act}
                      >
                        {act.slice(resource.length + 1)}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <div className="grid grid-cols-6 gap-1">
                {VERBS.map((verb) => {
                  const key = `${resource}:${verb}`;
                  const checked = shown.includes(key);
                  return (
                    <Button
                      key={verb}
                      type="button"
                      role="checkbox"
                      aria-checked={checked}
                      aria-label={key}
                      variant={checked ? "primary" : "outline"}
                      size="sm"
                      disabled={!editable || busy}
                      onClick={() => toggle(key, !checked)}
                      className="font-bold text-xs"
                      title={verb}
                    >
                      {verb[0].toUpperCase()}
                    </Button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Sticky Save Bar when dirty */}
      {editable && dirty && (
        <div className="sticky bottom-0 z-20 -mx-4 -mb-4 mt-6 border-t border-line bg-l1 p-4 shadow-[var(--shadow-l3)] sm:-mx-6 sm:-mb-6 transition-transform duration-200 animate-[sheet-in_200ms_ease-out]">
          <div className="flex flex-wrap items-center justify-between gap-3 max-w-7xl mx-auto">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-fg">Thay đổi chưa lưu</span>
              <span className="text-xs text-fg-3" aria-live="polite">
                Thêm {changes.added.length} · bỏ {changes.removed.length}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Button type="button" variant="outline" size="touch" disabled={busy} onClick={() => choose(current)}>
                Huỷ
              </Button>
              <Button type="button" variant="primary" size="touch" disabled={!dirty || busy} onClick={() => void save()}>
                {busy ? "Đang lưu…" : "Lưu thay đổi"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {editable && !dirty && (
        <div className="flex items-center justify-between pt-2">
          <span className="text-xs text-fg-3">Thay đổi quyền bằng checkbox hoặc chip bên trên.</span>
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

export function RoleMatrixView({ root }: { root: string }) {
  const { can } = useAccess();
  return (
    <RequireAction action="platform:role_matrix:read">
      <CompanyHeader root={root} title="Ma trận quyền" />
      <CompanyTabs root={root} />
      <div className="flex items-center gap-2 text-xs text-fg-3">
        <KeyRound className="size-4" aria-hidden="true" /> Quyền chỉ quyết định bằng action trả về từ tổ chức.
      </div>
      <RoleMatrix source="platform" root={root} editable={can("platform:role_matrix:update")} />
    </RequireAction>
  );
}
