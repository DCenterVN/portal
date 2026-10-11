"use client";

import { useState } from "react";
import { KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ConfirmDialog } from "@/components/ui/dialog";
import { Field, Select } from "@/components/ui/field";
import { Skeleton, EmptyState, ErrorState, InlineAlert } from "@/components/ui/state";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { errorText } from "./access";
import { RequireAction, useAccess } from "./access-boundary";
import { CompanyHeader, CompanyTabs } from "./company-detail-view";
import type { Source } from "./use-company";
import { actionChanges, replaceRole, resourcesOf, useRoleMatrix, VERBS } from "./use-role-matrix";

type Props = { source: Source; root: string; editable: boolean };

export function RoleMatrix({ source, root, editable }: Props) {
  const { data, error, isLoading, mutate } = useRoleMatrix(source, root);
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
      setDone(`Đã cập nhật ${current} cho mọi chi nhánh của công ty.`);
    } catch (failed) {
      setFailure(errorText(failed, { 400: "Có action thuộc module công ty chưa mua, hoặc action không hợp lệ.", 404: `Role ${current} không có trong danh mục.` }));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      {done && <InlineAlert tone="success">{done}</InlineAlert>}
      {failure && <InlineAlert>{failure}</InlineAlert>}
      {!editable && <InlineAlert tone="info">Chỉ xem. Ma trận quyền do quản trị nền tảng thay đổi.</InlineAlert>}
      <Field label="Role" htmlFor="role-select">
        <Select id="role-select" value={current} disabled={busy} onChange={(event) => (dirty ? setPending(event.target.value) : choose(event.target.value))}>
          {roles.map((code) => (
            <option key={code} value={code}>
              {code}
            </option>
          ))}
        </Select>
      </Field>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Tài nguyên</TableHead>
            {VERBS.map((verb) => (
              <TableHead key={verb} className="text-center">
                {verb}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {resourcesOf(data).map((resource) => (
            <TableRow key={resource}>
              <TableCell className="whitespace-nowrap font-mono text-xs">{resource}</TableCell>
              {VERBS.map((verb) => {
                const key = `${resource}:${verb}`;
                return (
                  <TableCell key={verb} className="text-center">
                    <Checkbox checked={shown.includes(key)} disabled={!editable || busy} onCheckedChange={(on) => toggle(key, on)} aria-label={key} className="justify-center" />
                  </TableCell>
                );
              })}
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {editable && (
        <div className="flex items-center gap-3">
          <Button size="touch" disabled={!dirty || busy} onClick={() => void save()}>
            Lưu thay đổi
          </Button>
          <span className="text-xs text-[var(--muted-foreground)]" aria-live="polite">
            Thêm {changes.added.length} · bỏ {changes.removed.length}
          </span>
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
      <div className="flex items-center gap-2 text-xs text-[var(--muted-foreground)]">
        <KeyRound className="size-4" aria-hidden="true" /> Quyền chỉ quyết định bằng action trả về từ tổ chức.
      </div>
      <RoleMatrix source="platform" root={root} editable={can("platform:role_matrix:update")} />
    </RequireAction>
  );
}
