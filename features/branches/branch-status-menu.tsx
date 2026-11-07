"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ConfirmDialog } from "@/components/patterns/confirm-dialog";
import { Field } from "@/components/patterns/form-field";
import { InlineAlert } from "@/components/patterns/inline-alert";
import { toast } from "@/components/ui/toast";
import { updateBranchStatus, type Branch, type BranchStatus } from "@/lib/api/branches-client";
import { errorText } from "@/features/platform/access";
import { notifySessionChanged } from "@/features/console/use-branch-switch";

type Step = "suspend" | "resume" | "close";

const STEPS: Record<Step, { status: BranchStatus; title: (name: string) => string; effect: string; confirm: string; done: string }> = {
  suspend: { status: "SUSPENDED", title: (name) => `Tạm ngừng ${name}?`, effect: "Không nhận đơn mới. Đơn đang xử lý và nhân viên vẫn làm được. Bạn có thể mở lại bất cứ lúc nào.", confirm: "Tạm ngừng", done: "Đã tạm ngừng" },
  resume: { status: "ACTIVE", title: (name) => `Mở lại ${name}?`, effect: "Chi nhánh nhận đơn mới trở lại.", confirm: "Mở lại", done: "Đã mở lại" },
  close: { status: "CLOSED", title: (name) => `Đóng ${name}?`, effect: "Chỉ còn xem, không mở lại được. Không thêm được nhân viên hay nhận đơn mới.", confirm: "Đóng chi nhánh", done: "Đã đóng" },
};

type Props = { branch: Branch; onChanged: () => Promise<unknown> };

export function BranchStatusMenu({ branch, onChanged }: Props) {
  const [step, setStep] = useState<Step | null>(null);
  const [typed, setTyped] = useState("");
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState("");
  const current = step ? STEPS[step] : null;
  const mustType = step === "close";

  function close() {
    setStep(null);
    setTyped("");
    setFailure("");
  }

  async function confirm() {
    if (!current) return;
    setBusy(true);
    setFailure("");
    try {
      await updateBranchStatus(branch.id, current.status);
      await onChanged();
      notifySessionChanged();
      toast.success(`${current.done} ${branch.name}.`);
      close();
    } catch (failed) {
      setFailure(errorText(failed, { 409: "Không đổi được trạng thái chi nhánh này." }));
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline">Trạng thái<ChevronDown className="size-4" /></Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {branch.status === "ACTIVE" && <DropdownMenuItem onSelect={() => setStep("suspend")}>Tạm ngừng</DropdownMenuItem>}
          {branch.status === "SUSPENDED" && <DropdownMenuItem onSelect={() => setStep("resume")}>Mở lại</DropdownMenuItem>}
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive" onSelect={() => setStep("close")}>Đóng chi nhánh</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <ConfirmDialog
        open={step !== null}
        onOpenChange={(open) => !open && close()}
        title={current?.title(branch.name) ?? ""}
        description={current?.effect}
        confirmLabel={current?.confirm ?? ""}
        danger={mustType}
        busy={busy}
        confirmDisabled={mustType && typed.trim() !== branch.name}
        onConfirm={() => void confirm()}
      >
        {mustType && (
          <Field label={`Gõ đúng tên "${branch.name}" để đóng`} htmlFor="close-branch-name">
            <Input id="close-branch-name" autoComplete="off" value={typed} onChange={(event) => setTyped(event.target.value)} disabled={busy} />
          </Field>
        )}
        {failure && <InlineAlert>{failure}</InlineAlert>}
      </ConfirmDialog>
    </>
  );
}
