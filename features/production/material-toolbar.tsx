"use client";

import { Search } from "lucide-react";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import type { MaterialGroup } from "@/lib/api/material-catalog";
import { MaterialGroupFilter } from "./material-group-filter";
import { STATUS_FILTERS, type StatusFilter } from "./materials-catalog";

type Props = { text: string; onText: (value: string) => void; groups: MaterialGroup[]; selected: string[]; counts: Record<string, number>; onGroups: (next: string[]) => void; status?: StatusFilter; onStatus?: (value: StatusFilter) => void };

export function MaterialToolbar({ text, onText, groups, selected, counts, onGroups, status, onStatus }: Props) {
  return <div className="flex flex-wrap items-center gap-2">
    <InputGroup data-testid="toolbar-search" className="w-70 shrink-0"><InputGroupAddon><Search aria-hidden="true" /></InputGroupAddon><InputGroupInput value={text} onChange={event => onText(event.target.value)} placeholder="Tìm tên…" aria-label="Tìm nguyên liệu" /></InputGroup>
    {groups.length > 0 && <MaterialGroupFilter groups={groups} selected={selected} counts={counts} onChange={onGroups} />}
    {status && onStatus && <div className="w-36 shrink-0"><NativeSelect data-testid="toolbar-status" aria-label="Trạng thái nguyên liệu" className="h-9" value={status} onChange={event => onStatus(event.target.value as StatusFilter)}>
      {STATUS_FILTERS.map(item => <NativeSelectOption key={item.slug} value={item.slug}>{item.label}</NativeSelectOption>)}
    </NativeSelect></div>}
  </div>;
}
