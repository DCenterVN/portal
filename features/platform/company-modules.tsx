"use client";

import { useState, type FormEvent } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/dialog";
import { Field, TextInput } from "@/components/ui/field";
import { Skeleton, EmptyState, ErrorState, InlineAlert } from "@/components/ui/state";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { errorText, formatTime } from "./access";
import { canToggle, moduleView, nextModuleStatus, readModuleChange, useModules, type ModuleView, type Source, setModule, type CompanyModule } from "./use-company";

const viewBadge: Record<ModuleView, { label: string; variant: "active" | "suspended" | "revoked" | "outline" }> = {
  active: { label: "Đang bật", variant: "active" },
  scheduled: { label: "Chưa tới hạn", variant: "suspended" },
  expired: { label: "Hết hạn", variant: "revoked" },
  inactive: { label: "Đã tắt", variant: "revoked" },
  not_purchased: { label: "Chưa mua", variant: "outline" },
};

type Props = { source: Source; root: string; editable: boolean };

export function CompanyModules({ source, root, editable }: Props) {
  const { data, error, isLoading, mutate } = useModules(source, root);
  const [target, setTarget] = useState<CompanyModule | null>(null);
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState("");
  const [done, setDone] = useState("");
  const turningOn = target ? nextModuleStatus(moduleView(target)) === "ACTIVE" : false;
  const cancelling = target ? moduleView(target) === "scheduled" : false;

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!target) return;
    const { change, error: invalid } = readModuleChange(new FormData(event.currentTarget), turningOn ? "ACTIVE" : "INACTIVE");
    if (!change) return setFailure(invalid ?? "");
    setBusy(true);
    setFailure("");
    try {
      await setModule(root, target.code, change);
      setDone(`Đã ${turningOn ? "bật" : "tắt"} module ${target.code}.`);
      setTarget(null);
    } catch (failed) {
      setFailure(errorText(failed, { 400: "Backend từ chối thay đổi (CORE không tắt được, hoặc dữ liệu hợp đồng sai)." }));
    } finally {
      setBusy(false);
      void mutate();
    }
  }

  if (isLoading) return <Skeleton title="Đang tải module…" />;
  if (error || !data) return <ErrorState title={errorText(error, { 404: "Không tìm thấy công ty này." })} onRetry={() => void mutate()} />;
  if (data.length === 0) return <EmptyState title="Công ty chưa có module nào." />;

  return (
    <div className="space-y-3">
      {done && <InlineAlert tone="success">{done}</InlineAlert>}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Module</TableHead>
            <TableHead>Trạng thái</TableHead>
            <TableHead className="hidden md:table-cell">Hợp đồng</TableHead>
            <TableHead className="hidden md:table-cell">Hiệu lực</TableHead>
            {editable && <TableHead className="text-right">Thao tác</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((module) => {
            const view = moduleView(module);
            return (
              <TableRow key={module.code}>
                <TableCell>
                  <p className="font-semibold">{module.code}</p>
                  <p className="text-xs text-[var(--muted-foreground)]">{module.name}</p>
                </TableCell>
                <TableCell>
                  <Badge variant={viewBadge[view].variant}>{module.always_on ? "Luôn bật" : viewBadge[view].label}</Badge>
                </TableCell>
                <TableCell className="hidden font-mono text-xs md:table-cell">{module.contract_ref || "—"}</TableCell>
                <TableCell className="hidden text-xs text-[var(--muted-foreground)] md:table-cell">
                  {formatTime(module.starts_at)} → {module.ends_at ? formatTime(module.ends_at) : "không thời hạn"}
                </TableCell>
                {editable && (
                  <TableCell className="text-right">
                    {canToggle(module) ? (
                      <Button variant={nextModuleStatus(view) === "INACTIVE" ? "outline" : "default"} size="touch" onClick={() => { setDone(""); setFailure(""); setTarget(module); }}>
                        {view === "scheduled" ? "Huỷ lịch" : view === "active" ? "Tắt" : "Bật"}
                      </Button>
                    ) : (
                      <span className="text-xs text-[var(--muted-foreground)]">Không tắt được</span>
                    )}
                  </TableCell>
                )}
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
      <ConfirmDialog
        open={Boolean(target)}
        onOpenChange={(open) => !open && setTarget(null)}
        title={`${turningOn ? "Bật" : cancelling ? "Huỷ lịch bật" : "Tắt"} module ${target?.code ?? ""}`}
        description={
          turningOn
            ? "Module có hiệu lực cho mọi chi nhánh của công ty từ thời điểm bắt đầu (để trống = ngay khi xác nhận)."
            : cancelling
              ? "Module đã hẹn lịch sẽ không được bật."
              : "Nhân viên công ty mất quyền của module này ngay khi tắt, kể cả OWNER."
        }
        confirmLabel={turningOn ? "Bật module" : cancelling ? "Huỷ lịch" : "Tắt module"}
        danger={!turningOn}
        busy={busy}
        onConfirm={() => (document.getElementById("module-change-form") as HTMLFormElement | null)?.requestSubmit()}
      >
        <form id="module-change-form" onSubmit={submit} className="grid gap-3" noValidate>
          <Field label="Mã hợp đồng" htmlFor="module-contract">
            <TextInput id="module-contract" name="contract_ref" defaultValue={target?.contract_ref ?? ""} required disabled={busy} />
          </Field>
          {turningOn && (
            <>
              <Field label="Bắt đầu (tuỳ chọn)" htmlFor="module-starts" hint="Để trống để bật ngay.">
                <TextInput id="module-starts" name="starts_at" type="datetime-local" disabled={busy} />
              </Field>
              <Field label="Kết thúc (tuỳ chọn)" htmlFor="module-ends" hint="Để trống nếu hợp đồng không thời hạn.">
                <TextInput id="module-ends" name="ends_at" type="datetime-local" disabled={busy} />
              </Field>
            </>
          )}
          {failure && <InlineAlert>{failure}</InlineAlert>}
        </form>
      </ConfirmDialog>
    </div>
  );
}
