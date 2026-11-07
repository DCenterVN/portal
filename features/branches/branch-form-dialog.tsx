"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Field } from "@/components/patterns/form-field";
import { InlineAlert } from "@/components/patterns/inline-alert";
import { createBranch } from "@/lib/api/branches-client";
import { BRANCH_CODE_PATTERN, branchCodeFromName } from "@/lib/branch-code";
import { errorStatus } from "@/lib/access";
import { errorText } from "@/features/platform/access";

const schema = z.object({
  name: z.string().trim().min(1, "Nhập tên cửa hàng.").max(255, "Tên tối đa 255 ký tự."),
  code: z.string().trim().regex(BRANCH_CODE_PATTERN, "Mã gồm 2 đến 64 ký tự: chữ không dấu, số, gạch ngang hoặc gạch dưới."),
});
type Values = z.infer<typeof schema>;

type Props = { open: boolean; onOpenChange: (open: boolean) => void; onCreated: () => Promise<unknown> };

export function BranchFormDialog({ open, onOpenChange, onCreated }: Props) {
  const router = useRouter();
  const form = useForm<Values>({ resolver: zodResolver(schema), mode: "onTouched", defaultValues: { name: "", code: "" } });
  const { errors, isSubmitting } = form.formState;

  const name = form.register("name", {
    onChange: (event) => {
      if (!form.getFieldState("code").isDirty) form.setValue("code", branchCodeFromName(event.target.value), { shouldValidate: form.formState.isSubmitted });
    },
  });

  async function submit(values: Values) {
    try {
      const branch = await createBranch({ name: values.name.trim(), code: values.code.trim() });
      await onCreated();
      form.reset();
      onOpenChange(false);
      router.push(`/branches/${branch.id}?moi=1`);
    } catch (failed) {
      const text = errorText(failed, { 409: "Mã này đã có, hãy đổi mã khác." });
      form.setError(errorStatus(failed) === 409 ? "code" : "root", { type: "server", message: text });
    }
  }

  return (
    <Dialog open={open} onOpenChange={(next) => { if (!isSubmitting) { if (!next) form.reset(); onOpenChange(next); } }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Thêm cửa hàng</DialogTitle>
          <DialogDescription>Đặt tên cửa hàng. Mã tự sinh từ tên, bạn có thể sửa.</DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(submit)} className="space-y-4" noValidate>
          <Field label="Tên cửa hàng" htmlFor="branch-name" error={errors.name?.message}>
            <Input id="branch-name" autoFocus autoComplete="off" disabled={isSubmitting} {...name} />
          </Field>
          <Field label="Mã" htmlFor="branch-code" hint="Dùng để nhận diện cửa hàng trong hệ thống." error={errors.code?.message}>
            <Input id="branch-code" autoComplete="off" className="font-mono" disabled={isSubmitting} {...form.register("code")} />
          </Field>
          {errors.root?.message && <InlineAlert>{errors.root.message}</InlineAlert>}
          <DialogFooter>
            <Button type="button" variant="outline" disabled={isSubmitting} onClick={() => { form.reset(); onOpenChange(false); }}>Huỷ</Button>
            <Button type="submit" disabled={isSubmitting}>{isSubmitting ? "Đang lưu…" : "Lưu"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
