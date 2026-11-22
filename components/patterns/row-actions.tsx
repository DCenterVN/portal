"use client";

import type { LucideIcon } from "lucide-react";
import { MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Tip } from "@/components/patterns/tip";

export type RowAction = { label: string; icon: LucideIcon; onSelect: () => void; danger?: boolean; hidden?: boolean };

export function RowActions({ label, actions }: { label: string; actions: RowAction[] }) {
  const visible = actions.filter(action => !action.hidden);
  if (!visible.length) return null;
  const normal = visible.filter(action => !action.danger);
  const danger = visible.filter(action => action.danger);
  return <DropdownMenu>
    <Tip label="Thao tác">
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label={`Thao tác cho ${label}`}><MoreHorizontal aria-hidden="true" /></Button>
      </DropdownMenuTrigger>
    </Tip>
    <DropdownMenuContent align="end" className="min-w-40">
      {normal.map(({ label: text, icon: Icon, onSelect }) => <DropdownMenuItem key={text} onSelect={onSelect}><Icon aria-hidden="true" />{text}</DropdownMenuItem>)}
      {normal.length > 0 && danger.length > 0 && <DropdownMenuSeparator />}
      {danger.map(({ label: text, icon: Icon, onSelect }) => <DropdownMenuItem key={text} variant="destructive" onSelect={onSelect}><Icon aria-hidden="true" />{text}</DropdownMenuItem>)}
    </DropdownMenuContent>
  </DropdownMenu>;
}
