import type { ReactNode } from "react";

type SettingRowProps = { label: string; children: ReactNode; action?: ReactNode };

export function SettingRow({ label, children, action }: SettingRowProps) {
  return <div className="flex flex-wrap items-center gap-2 sm:gap-4 py-3">
    <dt className="basis-full text-sm text-muted-foreground sm:basis-auto sm:w-48 sm:shrink-0">{label}</dt>
    <dd className="min-w-0 flex-1 break-words text-sm">{children}</dd>
    {action}
  </div>;
}
