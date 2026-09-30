"use client";

import { useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import type { Route } from "next";
import { Plus } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Checkbox, Field, TextInput } from "@/components/ui/field";
import { InlineAlert } from "@/components/ui/state";
import { errorText } from "./access";
import { OPTIONAL_MODULES, readOnboard, type OnboardErrors, onboardCompany } from "./use-companies";

const fields = [
  { name: "name", label: "Tên công ty", type: "text", autoComplete: "organization" },
  { name: "code", label: "Mã công ty", type: "text", autoComplete: "off" },
  { name: "contract_ref", label: "Mã hợp đồng", type: "text", autoComplete: "off" },
  { name: "owner_email", label: "Email OWNER", type: "email", autoComplete: "email" },
  { name: "owner_display_name", label: "Tên OWNER", type: "text", autoComplete: "name" },
] as const;

export function CompanyOnboardForm({ onCreated }: { onCreated: () => void }) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<OnboardErrors>({});
  const [failure, setFailure] = useState("");
  const [created, setCreated] = useState<{ id: string; code: string } | null>(null);
  // Same body => same Idempotency-Key, so a retry after a network error cannot onboard twice.
  const attempt = useRef<{ body: string; key: string } | null>(null);

  function reset(next: boolean) {
    if (busy) return;
    setOpen(next);
    setErrors({});
    setFailure("");
    setCreated(null);
    attempt.current = null;
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const { input, errors: found } = readOnboard(new FormData(event.currentTarget));
    setErrors(found);
    setFailure("");
    if (Object.keys(found).length > 0) return;
    const body = JSON.stringify(input);
    if (attempt.current?.body !== body) attempt.current = { body, key: crypto.randomUUID() };
    setBusy(true);
    try {
      const result = await onboardCompany(input, attempt.current.key);
      setCreated({ id: result.branch_id, code: result.code });
      attempt.current = null;
      onCreated();
    } catch (error) {
      setFailure(errorText(error, { 409: "Mã công ty hoặc yêu cầu onboard này đã tồn tại." }));
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <Button size="touch" onClick={() => reset(true)}>
        <Plus aria-hidden="true" /> Onboard công ty
      </Button>
      <Dialog open={open} onOpenChange={reset}>
        <DialogContent size="lg" aria-labelledby="onboard-title">
          <DialogHeader>
            <DialogTitle id="onboard-title">Onboard công ty theo hợp đồng</DialogTitle>
            <DialogDescription>Tạo chi nhánh MAIN, OWNER theo email và bật module đã mua. CORE luôn bật.</DialogDescription>
          </DialogHeader>
          {created ? (
            <div className="space-y-4">
              <InlineAlert tone="success">
                Đã tạo công ty <strong>{created.code}</strong>. OWNER sẽ nhận email kích hoạt.
              </InlineAlert>
              <DialogFooter>
                <Button variant="outline" size="touch" onClick={() => reset(false)}>
                  Đóng
                </Button>
                <Link href={`/platform/companies/${created.id}` as Route} className={buttonVariants({ size: "touch" })}>
                  Mở công ty
                </Link>
              </DialogFooter>
            </div>
          ) : (
            <form onSubmit={submit} noValidate aria-busy={busy} className="grid gap-4 sm:grid-cols-2">
              {fields.map((field) => (
                <Field key={field.name} label={field.label} htmlFor={`onboard-${field.name}`} error={errors[field.name]}>
                  <TextInput
                    id={`onboard-${field.name}`}
                    name={field.name}
                    type={field.type}
                    autoComplete={field.autoComplete}
                    disabled={busy}
                  />
                </Field>
              ))}
              <fieldset className="grid gap-2 sm:col-span-2">
                <legend className="mb-1 text-xs font-medium">Module theo hợp đồng</legend>
                <div className="grid gap-2 sm:grid-cols-2">
                  <Checkbox id="onboard-module-CORE" label="CORE" description="Luôn bật" checked disabled readOnly />
                  {OPTIONAL_MODULES.map((module) => (
                    <Checkbox key={module.code} id={`onboard-module-${module.code}`} name="modules" value={module.code} label={module.code} description={module.label} disabled={busy} />
                  ))}
                </div>
              </fieldset>
              {failure && <InlineAlert className="sm:col-span-2">{failure}</InlineAlert>}
              <DialogFooter className="sm:col-span-2">
                <Button type="button" variant="outline" size="touch" disabled={busy} onClick={() => reset(false)}>
                  Huỷ
                </Button>
                <Button type="submit" size="touch" disabled={busy}>
                  {busy ? "Đang tạo…" : "Tạo công ty"}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
