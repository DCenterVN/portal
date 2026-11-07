"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { fold } from "@/components/patterns/entity-picker";
import { ROLE_SEARCH_FROM, type RoleOption } from "@/lib/role-catalog";

type Props = {
  label: string;
  options: readonly RoleOption[];
  selected: readonly string[];
  onToggle: (code: string) => void;
  disabled?: boolean;
  lockedCodes?: readonly string[];
  emptyText?: string;
};

export function RolePicker({ label, options, selected, onToggle, disabled, lockedCodes = [], emptyText = "Chưa có vai trò nào để chọn." }: Props) {
  const [query, setQuery] = useState("");
  const searchable = options.length >= ROLE_SEARCH_FROM;
  const needle = fold(query.trim());
  const shown = searchable ? options.filter((option) => fold(`${option.name} ${option.job ?? ""}`).includes(needle)) : options;
  if (options.length === 0) return <p className="text-sm text-muted-foreground">{emptyText}</p>;
  return (
    <div className="space-y-2">
      {searchable && (
        <InputGroup>
          <InputGroupAddon><Search aria-hidden="true" /></InputGroupAddon>
          <InputGroupInput placeholder="Gõ tên vai trò" aria-label="Tìm vai trò" value={query} onChange={(event) => setQuery(event.target.value)} />
        </InputGroup>
      )}
      <div className={searchable ? "max-h-72 overflow-y-auto pr-1" : undefined}>
        <div className="grid gap-3 sm:grid-cols-2" role="group" aria-label={label}>
          {shown.map((option) => {
            const on = selected.includes(option.code);
            return (
              <div key={option.code} className="space-y-1">
                <Button type="button" size="sm" variant={on ? "default" : "outline"} aria-pressed={on} disabled={disabled || lockedCodes.includes(option.code)} onClick={() => onToggle(option.code)}>{option.name}</Button>
                {option.job && <p className="text-xs text-muted-foreground">{option.job}</p>}
              </div>
            );
          })}
        </div>
        {shown.length === 0 && <p className="py-2 text-sm text-muted-foreground">{`Không thấy vai trò “${query}”.`}</p>}
      </div>
    </div>
  );
}
