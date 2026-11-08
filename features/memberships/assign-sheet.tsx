"use client";

import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { AssignmentPanel } from "./assignment-panel";
import type { AssignmentEditorProps } from "./use-assignment-editor";

export function AssignSheet({ onClose, ...props }: AssignmentEditorProps & { onClose: () => void }) {
  const t = useTranslations("record");
  const [busy, setBusy] = useState(false);
  return <Sheet open onOpenChange={(next) => { if (!next && !busy) onClose(); }}>
    <SheetContent showCloseButton={false} className="overflow-y-auto sm:max-w-lg">
      <SheetHeader><SheetTitle>{t("assignments")}: {props.person.name}</SheetTitle><SheetDescription>{props.person.email}</SheetDescription></SheetHeader>
      <div className="px-4 pb-4"><AssignmentPanel {...props} onComplete={onClose} onBusyChange={setBusy} /></div>
    </SheetContent>
  </Sheet>;
}
