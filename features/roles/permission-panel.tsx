"use client";

import { useState } from "react";
import { ChevronDown, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { EmptyState } from "@/components/patterns/empty-state";
import { groupPermissions, toggleGroup } from "@/lib/permission-labels";

type Props = { catalog: string[]; draft: string[]; editable: boolean; onChange: (next: string[]) => void };

export function PermissionPanel({ catalog, draft, editable, onChange }: Props) {
  const [query, setQuery] = useState("");
  const [closed, setClosed] = useState<string[]>([]);
  const groups = groupPermissions(catalog, draft, query);
  const searching = query.trim() !== "";
  const flip = (area: string) => setClosed(closed.includes(area) ? closed.filter((item) => item !== area) : [...closed, area]);
  const set = (key: string, on: boolean) => onChange(on ? [...draft, key] : draft.filter((item) => item !== key));

  return (
    <div className="space-y-3">
      <InputGroup>
        <InputGroupAddon><Search aria-hidden /></InputGroupAddon>
        <InputGroupInput aria-label="Tìm quyền" placeholder="Tìm quyền, ví dụ: phiếu nhập" value={query} onChange={(event) => setQuery(event.target.value)} />
      </InputGroup>
      {groups.length === 0 && <EmptyState title="Không có quyền nào khớp" description="Thử từ khoá khác, hoặc xoá ô tìm." />}
      {groups.map((group) => {
        const keys = catalog.filter((key) => group.items.some((item) => item.key === key));
        return (
          <Collapsible key={group.area} open={searching || !closed.includes(group.area)} onOpenChange={() => flip(group.area)} className="rounded-xl border border-border bg-card">
            <div className="flex items-center gap-3 px-4 py-3">
              <Checkbox
                aria-label={`Chọn cả nhóm ${group.area}`}
                checked={group.state}
                disabled={!editable}
                onCheckedChange={(on) => onChange(toggleGroup(draft, keys, on === true))}
              />
              <CollapsibleTrigger className="flex flex-1 items-center justify-between gap-2 text-left" aria-label={`${group.area}, ${group.granted} trên ${group.total}`}>
                <span className="font-medium">{group.area}</span>
                <span className="flex items-center gap-2">
                  <Badge variant={group.granted === 0 ? "outline" : "secondary"}>{group.granted}/{group.total} đã cấp</Badge>
                  <ChevronDown className="size-4 text-muted-foreground" aria-hidden />
                </span>
              </CollapsibleTrigger>
            </div>
            <CollapsibleContent>
              <ul className="divide-y divide-border border-t border-border">
                {group.items.map((item) => (
                  <li key={item.key}>
                    <label className="flex cursor-pointer items-center gap-3 px-4 py-2.5 text-sm hover:bg-muted">
                      <Checkbox checked={item.granted} disabled={!editable} onCheckedChange={(on) => set(item.key, on === true)} />
                      <span>{item.label}</span>
                    </label>
                  </li>
                ))}
              </ul>
            </CollapsibleContent>
          </Collapsible>
        );
      })}
    </div>
  );
}
