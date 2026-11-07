"use client";

import { useState } from "react";
import { Command, CommandInput } from "@/components/ui/command";
import { EntityList, entityMatcher, filterEntities } from "@/components/patterns/entity-picker";
import { branchLabel, branchMeta, type BranchChoice } from "@/lib/branch-label";
import { BRANCH_SEARCH_FROM } from "@/lib/branch-choices";

type Props = { branches: BranchChoice[]; currentId?: string; onPick: (branchId: string) => void };

const getId = (branch: BranchChoice) => branch.id;
const getMeta = (branch: BranchChoice) => branchMeta(branch, branch.roles);
const matches = entityMatcher(branchLabel, getMeta);

export function BranchList({ branches, currentId, onPick }: Props) {
  const [query, setQuery] = useState("");
  const searchable = branches.length >= BRANCH_SEARCH_FROM;
  return (
    <Command shouldFilter={false}>
      {searchable && <CommandInput value={query} onValueChange={setQuery} placeholder="Gõ tên chi nhánh" aria-label="Tìm chi nhánh" />}
      <EntityList
        options={filterEntities(branches, query, matches)}
        picked={currentId ?? null}
        onPick={onPick}
        emptyMessage={`Không tìm thấy “${query}”.`}
        getId={getId}
        getLabel={branchLabel}
        getMeta={getMeta}
      />
    </Command>
  );
}
