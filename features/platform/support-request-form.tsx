"use client";

import { useState, type FormEvent } from "react";
import { ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/dialog";
import { Checkbox, Field, Select, TextInput, Textarea } from "@/components/ui/field";
import { InlineAlert } from "@/components/ui/state";
import { errorText } from "./access";
import { BREAK_GLASS_CONFLICT, BREAK_GLASS_HOURS, readSupport, usableCompanies, useCompanyOptions, breakGlass, requestSupport, type SupportRequest } from "./use-support";

export function SupportRequestForm({ canBreakGlass, onDone }: { canBreakGlass: boolean; onDone: () => void }) {
  const companies = useCompanyOptions();
  const [emergency, setEmergency] = useState(false);
  const [pending, setPending] = useState<SupportRequest | null>(null);
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState("");
  const [done, setDone] = useState("");
  const [invalid, setInvalid] = useState<ReturnType<typeof readSupport>>({});

  async function send(input: SupportRequest, glass: boolean) {
    // Fail closed: the company list could not be re-verified, so do not act on a choice made from stale data.
    if (companies.error) {
      setFailure(errorText(companies.error));
      return false;
    }
    setBusy(true);
    setFailure("");
    try {
      const grant = glass ? await breakGlass(input.root_branch_id, input.reason, input.ticket_ref) : await requestSupport(input);
      setDone(grant.starts_at ? "Grant có hiệu lực ngay." : "Đã gửi yêu cầu, chờ OWNER của công ty duyệt.");
      setPending(null);
      onDone();
      return true;
    } catch (failed) {
      // No automatic retry: a 409 on break-glass is a decision, not a glitch.
      setFailure(errorText(failed, glass ? { 409: BREAK_GLASS_CONFLICT } : {}));
      return false;
    } finally {
      setBusy(false);
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setDone("");
    const formElement = event.currentTarget;
    const checked = readSupport(new FormData(formElement));
    setInvalid(checked);
    const { input } = checked;
    if (!input) return;
    if (emergency) return setPending(input);
    if (await send(input, false)) formElement.reset();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Xin quyền hỗ trợ</CardTitle>
        <CardDescription>Công ty bật đồng ý thường trực → hiệu lực ngay 24 giờ. Không → chờ OWNER duyệt.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={submit} noValidate aria-busy={busy} className="grid gap-4">
          <Field label="Công ty" htmlFor="support-root" error={invalid.field === "root_branch_id" ? invalid.error : undefined}>
            <Select id="support-root" name="root_branch_id" defaultValue="" disabled={busy || companies.isLoading || Boolean(companies.error)}>
              <option value="" disabled>
                {companies.isLoading ? "Đang tải công ty…" : "Chọn công ty"}
              </option>
              {usableCompanies(companies).map((company) => (
                <option key={company.root_branch_id} value={company.root_branch_id}>
                  {company.name} · {company.code}
                </option>
              ))}
            </Select>
          </Field>
          {companies.error && <InlineAlert>{errorText(companies.error)}</InlineAlert>}
          {companies.data && !companies.error && companies.data.items.length === companies.data.limit && (
            <InlineAlert tone="info">Chỉ hiện {companies.data.limit} công ty đầu. Công ty khác chưa chọn được ở đây (D-099).</InlineAlert>
          )}
          <Field label="Lý do" htmlFor="support-reason" error={invalid.field === "reason" ? invalid.error : undefined}>
            <Textarea id="support-reason" name="reason" required disabled={busy} placeholder="Mô tả sự cố cần hỗ trợ" />
          </Field>
          <Field label="Mã phiếu hỗ trợ" htmlFor="support-ticket" hint="Tuỳ chọn, ví dụ mã ticket CSKH.">
            <TextInput id="support-ticket" name="ticket_ref" disabled={busy} />
          </Field>
          {canBreakGlass && (
            <Checkbox
              id="support-break-glass"
              checked={emergency}
              onChange={(event) => setEmergency(event.target.checked)}
              disabled={busy}
              label="Break-glass (khẩn cấp)"
              description={`Hiệu lực ngay, tối đa ${BREAK_GLASS_HOURS} giờ, không cần OWNER. Mỗi công ty 1 lần trong 24 giờ.`}
            />
          )}
          {emergency && (
            <InlineAlert tone="warning">
              Break-glass có hiệu lực ngay trong <strong>{BREAK_GLASS_HOURS} giờ</strong> và được ghi audit riêng. Chỉ dùng khi sự cố khẩn cấp.
            </InlineAlert>
          )}
          {failure && <InlineAlert>{failure}</InlineAlert>}
          {done && <InlineAlert tone="success">{done}</InlineAlert>}
          <div className="flex justify-end">
            <Button type="submit" size="touch" variant={emergency ? "destructive" : "default"} disabled={busy || Boolean(companies.error)}>
              {busy ? "Đang gửi…" : emergency ? "Mở break-glass" : "Gửi yêu cầu"}
            </Button>
          </div>
        </form>
      </CardContent>
      <ConfirmDialog
        open={Boolean(pending)}
        onOpenChange={(value) => !value && setPending(null)}
        title="Xác nhận break-glass"
        description={`Bạn sẽ có quyền ngang OWNER trong ${BREAK_GLASS_HOURS} giờ. Công ty không dùng lại được break-glass trong 24 giờ.`}
        confirmLabel={`Mở ${BREAK_GLASS_HOURS} giờ`}
        danger
        busy={busy}
        confirmDisabled={Boolean(companies.error)}
        onConfirm={() => pending && void send(pending, true)}
      >
        <div className="flex items-start gap-2 text-sm">
          <ShieldAlert className="mt-0.5 size-4 shrink-0 text-[var(--destructive)]" aria-hidden="true" />
          <p>Lý do: {pending?.reason}</p>
        </div>
        {failure && <InlineAlert className="mt-3">{failure}</InlineAlert>}
      </ConfirmDialog>
    </Card>
  );
}
