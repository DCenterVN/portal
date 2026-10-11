"use client";

import { useState, type FormEvent } from "react";
import { UserPlus, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/dialog";
import { Field, Select, TextInput } from "@/components/ui/field";
import { PageHeader } from "@/components/ui/page";
import { Skeleton, EmptyState, ErrorState, InlineAlert } from "@/components/ui/state";
import { Table, TableBody, TableCell, TableHead, TableHeader, TablePager, TableRow } from "@/components/ui/table";
import { errorText, formatTime } from "./access";
import { RequireAction } from "./access-boundary";
import { ALREADY_STAFF_CONFLICT, LAST_ADMIN_CONFLICT, readStaffGrant, STAFF_ROLES, useStaff, grantStaff, revokeStaff, type PlatformStaff } from "./use-staff";

function StaffList() {
  const [page, setPage] = useState(1);
  const { data, error, isLoading, isValidating, mutate } = useStaff(page);
  const [adding, setAdding] = useState(false);
  const [target, setTarget] = useState<PlatformStaff | null>(null);
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState("");
  const [done, setDone] = useState("");
  const [invalid, setInvalid] = useState<ReturnType<typeof readStaffGrant>>({});

  function openAdd() {
    setFailure("");
    setInvalid({});
    setDone("");
    setAdding(true);
  }

  async function add(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const checked = readStaffGrant(new FormData(event.currentTarget));
    setInvalid(checked);
    const { input } = checked;
    if (!input) return;
    setBusy(true);
    setFailure("");
    try {
      await grantStaff(input.userId, input.role);
      setDone("Đã cấp quyền nhân sự nền tảng.");
      setAdding(false);
      void mutate();
    } catch (failed) {
      setFailure(errorText(failed, { 409: ALREADY_STAFF_CONFLICT, 404: "Không tìm thấy tài khoản với User ID này." }));
    } finally {
      setBusy(false);
    }
  }

  async function revoke() {
    if (!target) return;
    setBusy(true);
    setFailure("");
    try {
      await revokeStaff(target.user_id);
      setDone("Đã thu hồi quyền nhân sự nền tảng.");
      setTarget(null);
      void mutate();
    } catch (failed) {
      setFailure(errorText(failed, { 409: LAST_ADMIN_CONFLICT }));
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <PageHeader
        icon={<Users />}
        title="Nhân sự nền tảng"
        description="Người nền tảng không có membership chi nhánh; quyền đến từ vai trò nền tảng."
        actions={
          <Button size="touch" onClick={openAdd}>
            <UserPlus aria-hidden="true" /> Cấp quyền
          </Button>
        }
      />
      {done && <InlineAlert tone="success">{done}</InlineAlert>}
      {isLoading ? (
        <Skeleton title="Đang tải nhân sự…" />
      ) : error || !data ? (
        <ErrorState title={errorText(error)} onRetry={() => void mutate()} />
      ) : data.items.length === 0 ? (
        <EmptyState title="Chưa có nhân sự nền tảng ở trang này." action={page > 1 && <Button variant="outline" size="touch" onClick={() => setPage(page - 1)}>Trang trước</Button>} />
      ) : (
        <div>
          <Table aria-busy={isValidating}>
            <TableHeader>
              <TableRow>
                <TableHead>User ID</TableHead>
                <TableHead>Vai trò</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead className="hidden md:table-cell">Cấp lúc</TableHead>
                <TableHead className="text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.items.map((member) => (
                <TableRow key={member.user_id}>
                  <TableCell className="font-mono text-xs">{member.user_id}</TableCell>
                  <TableCell className="font-mono text-xs">{member.role}</TableCell>
                  <TableCell>
                    <Badge variant={member.status === "ACTIVE" ? "active" : "revoked"}>{member.status === "ACTIVE" ? "Đang hoạt động" : "Đã thu hồi"}</Badge>
                  </TableCell>
                  <TableCell className="hidden text-xs text-[var(--muted-foreground)] md:table-cell">{formatTime(member.granted_at)}</TableCell>
                  <TableCell className="text-right">
                    {member.status === "ACTIVE" && (
                      <Button variant="outline" size="touch" onClick={() => { setFailure(""); setDone(""); setTarget(member); }}>
                        Thu hồi
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <TablePager page={page} hasNext={data.items.length === data.limit} onPage={setPage} busy={isValidating} />
        </div>
      )}
      <ConfirmDialog
        open={adding}
        onOpenChange={setAdding}
        title="Cấp quyền nhân sự nền tảng"
        description="Tài khoản phải có sẵn trong auth. Thao tác được ghi audit."
        confirmLabel="Cấp quyền"
        busy={busy}
        onConfirm={() => (document.getElementById("staff-grant-form") as HTMLFormElement | null)?.requestSubmit()}
      >
        <form id="staff-grant-form" onSubmit={add} noValidate className="grid gap-3">
          <Field label="User ID" htmlFor="staff-user" error={invalid.field === "user_id" ? invalid.error : undefined}>
            <TextInput id="staff-user" name="user_id" autoComplete="off" placeholder="UUID tài khoản" disabled={busy} />
          </Field>
          <Field label="Vai trò" htmlFor="staff-role" error={invalid.field === "role" ? invalid.error : undefined}>
            <Select id="staff-role" name="role" defaultValue="PLATFORM_SUPPORT" disabled={busy}>
              {STAFF_ROLES.map((role) => (
                <option key={role.code} value={role.code}>
                  {role.label} ({role.code})
                </option>
              ))}
            </Select>
          </Field>
          {failure && <InlineAlert>{failure}</InlineAlert>}
        </form>
      </ConfirmDialog>
      <ConfirmDialog
        open={Boolean(target)}
        onOpenChange={(open) => !open && setTarget(null)}
        title="Thu hồi nhân sự nền tảng"
        description={`${target?.user_id ?? ""} (${target?.role ?? ""}) mất toàn bộ quyền nền tảng ngay lập tức.`}
        confirmLabel="Thu hồi"
        danger
        busy={busy}
        onConfirm={() => void revoke()}
      >
        {failure && <InlineAlert>{failure}</InlineAlert>}
      </ConfirmDialog>
    </>
  );
}

export function StaffView() {
  return (
    <RequireAction action="platform:staff:read">
      <StaffList />
    </RequireAction>
  );
}
