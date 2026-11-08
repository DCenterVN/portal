"use client";

import { useRef, useState } from "react";
import { Controller, useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Field } from "@/components/patterns/form-field";
import { EntityPicker } from "@/components/patterns/entity-picker";
import { RolePicker } from "@/components/patterns/role-picker";
import { InlineAlert } from "@/components/patterns/inline-alert";
import { toast } from "@/components/ui/toast";
import type { Branch } from "@/lib/api/branches-client";
import { branchLabel, branchMeta } from "@/lib/branch-label";
import { createMembership, type Membership } from "@/lib/api/platform-client";
import { keepFitting, roleOptionsFor } from "@/lib/role-catalog";
import { cn } from "@/lib/utils";
import { errorStatus } from "@/lib/access";
import { errorText } from "@/features/platform/access";
import { useRoleCatalog } from "@/features/roles/use-roles";
import { candidatePeople, type Person } from "./use-branches";

const WRONG_ROLE = "Có vai trò không dùng được ở loại chi nhánh này. Hãy bỏ chọn vai trò đó rồi lưu lại.";
const roles = z.array(z.string()).min(1, "Chọn ít nhất một vai trò.");
const existingSchema = z.object({ roles, name: z.string(), email: z.string() });
const newSchema = z.object({
  roles,
  name: z.string().trim().min(1, "Nhập họ tên."),
  email: z.string().trim().email("Nhập email hợp lệ."),
});
type Values = z.infer<typeof newSchema>;

type Props = { open: boolean; onOpenChange: (open: boolean) => void; branch: Branch; branches?: Branch[]; members: Membership[]; onSaved: () => Promise<unknown> };

export function AddStaffDialog({ open, onOpenChange, branch: initial, branches, members, onSaved }: Props) {
  const [picked, setPicked] = useState(initial.id);
  const branch = branches?.find((item) => item.id === picked) ?? initial;
  const [mode, setMode] = useState<"existing" | "new">("existing");
  const [query, setQuery] = useState("");
  const [person, setPerson] = useState<Person | null>(null);
  const modeRef = useRef(mode);
  modeRef.current = mode;
  const resolver: Resolver<Values> = (values, context, options) =>
    zodResolver(modeRef.current === "new" ? newSchema : existingSchema)(values, context, options) as ReturnType<Resolver<Values>>;
  const form = useForm<Values>({ resolver, mode: "onTouched", defaultValues: { roles: [], name: "", email: "" } });
  const { errors, isSubmitting } = form.formState;
  const catalog = useRoleCatalog(open);
  const roleOptions = roleOptionsFor(catalog.data ?? [], branch.type).filter((option) => !option.protected);
  const matches = candidatePeople(members, branch.id, query);
  const ready = mode === "new" || person !== null;

  function reset() {
    form.reset();
    setMode("existing");
    setQuery("");
    setPerson(null);
  }

  function changeBranch(id: string | null) {
    const next = branches?.find((item) => item.id === id);
    if (!next) return;
    setPicked(next.id);
    setPerson(null);
    form.setValue("roles", keepFitting(catalog.data ?? [], next.type, form.getValues("roles")));
    form.clearErrors("roles");
  }

  function close() {
    reset();
    onOpenChange(false);
  }

  async function submit(values: Values) {
    const who = mode === "new" ? { display_name: values.name.trim(), email: values.email.trim() } : person && { user_id: person.userId };
    if (!who) return;
    try {
      await createMembership({ ...who, role_codes: values.roles, branch_id: branch.id });
      await onSaved();
      toast.success(`Đã thêm ${"display_name" in who ? who.display_name : person?.name} vào ${branchLabel(branch)}.`);
      close();
    } catch (failed) {
      const message = errorText(failed, { 400: WRONG_ROLE, 409: "Người này đã có trong chi nhánh." });
      form.setError(errorStatus(failed) === 400 ? "roles" : "root", { type: "server", message });
    }
  }

  return (
    <Dialog open={open} onOpenChange={(next) => { if (!isSubmitting) { if (!next) reset(); onOpenChange(next); } }}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Thêm nhân viên vào {branchLabel(branch)}</DialogTitle>
          <DialogDescription>{mode === "existing" ? "Chọn người đã có trong hệ thống, rồi chọn việc họ làm ở đây." : "Nhập thông tin người mới, rồi chọn việc họ làm ở đây."}</DialogDescription>
        </DialogHeader>
        {branches && (
          <EntityPicker
            label="Chi nhánh"
            name="staff-branch"
            serializeValue={false}
            required
            items={branches}
            status="ready"
            getId={(item) => item.id}
            getLabel={branchLabel}
            getMeta={(item) => branchMeta(item)}
            value={branch.id}
            onChange={(id) => changeBranch(id)}
            placeholder="Chọn chi nhánh"
            searchPlaceholder="Gõ tên chi nhánh"
          />
        )}
        <form onSubmit={form.handleSubmit(submit)} className="space-y-4" noValidate>
          {mode === "existing" ? (
            <div className="space-y-2">
              <InputGroup>
                <InputGroupAddon><Search aria-hidden="true" /></InputGroupAddon>
                <InputGroupInput placeholder="Tìm theo tên hoặc email" aria-label="Tìm nhân viên" value={query} onChange={(event) => setQuery(event.target.value)} autoFocus />
              </InputGroup>
              <RadioGroup aria-label="Kết quả tìm" value={person?.userId ?? ""} onValueChange={(id) => setPerson(matches.find((item) => item.userId === id) ?? null)} className="max-h-44 gap-0 divide-y divide-border overflow-y-auto rounded-lg border border-border">
                {matches.map((item) => (
                  <label key={item.userId} className={cn("flex cursor-pointer items-start gap-3 px-3 py-2 text-sm hover:bg-muted", person?.userId === item.userId && "bg-muted")}>
                    <RadioGroupItem value={item.userId} className="mt-1" />
                    <span className="min-w-0">
                      <span className="block font-medium">{item.name}</span>
                      <span className="block text-xs text-muted-foreground">{item.email} · đang ở {item.branches.join(", ")}</span>
                    </span>
                  </label>
                ))}
                {matches.length === 0 && <p className="px-3 py-3 text-sm text-muted-foreground">Không thấy ai khớp.</p>}
              </RadioGroup>
              <Button type="button" variant="link" size="sm" onClick={() => setMode("new")}>Không thấy? Mời người mới</Button>
            </div>
          ) : (
            <div className="space-y-3">
              <Field label="Họ và tên" htmlFor="staff-name" error={errors.name?.message}><Input id="staff-name" autoFocus autoComplete="off" {...form.register("name")} /></Field>
              <Field label="Email" htmlFor="staff-email" error={errors.email?.message}><Input id="staff-email" type="email" autoComplete="off" {...form.register("email")} /></Field>
              <p className="text-sm text-muted-foreground">Họ sẽ nhận thư để tự đặt mật khẩu.</p>
              <Button type="button" variant="link" size="sm" onClick={() => setMode("existing")}>Chọn người đã có</Button>
            </div>
          )}
          <Controller control={form.control} name="roles" render={({ field }) => (
            <fieldset className="space-y-2">
              <legend className="mb-2 text-sm font-medium">Việc ở {branchLabel(branch)}</legend>
              {catalog.error ? <InlineAlert>Không tải được danh sách vai trò. <Button type="button" variant="outline" size="sm" onClick={() => void catalog.mutate()}>Thử lại</Button></InlineAlert>
                : !catalog.data ? <p className="text-sm text-muted-foreground">Đang tải danh sách vai trò…</p>
                : <RolePicker label="Chọn vai trò" options={roleOptions} selected={field.value} onToggle={(code) => field.onChange(field.value.includes(code) ? field.value.filter((value) => value !== code) : [...field.value, code])} emptyText="Chi nhánh này chưa có vai trò nào dùng được." />}
              {errors.roles?.message && <p className="text-xs font-medium text-destructive">{errors.roles.message}</p>}
            </fieldset>
          )} />
          {errors.root?.message && <InlineAlert>{errors.root.message}</InlineAlert>}
          <DialogFooter>
            <Button type="button" variant="outline" disabled={isSubmitting} onClick={close}>Huỷ</Button>
            <Button type="submit" disabled={isSubmitting || !ready}>{isSubmitting ? "Đang lưu…" : "Lưu"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
