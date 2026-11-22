import { useEffect, useState } from "react";
import { listMaterials, type MaterialCategory, type Status } from "@/lib/api/material-catalog";
import { countByCode } from "./materials-catalog";

const STATUSES: Status[] = ["ACTIVE", "DRAFT", "SUSPENDED"];

export async function loadCodeCounts(tree: MaterialCategory[]) {
  const lists = await Promise.all(STATUSES.map(status => listMaterials(status, tree)));
  return countByCode(lists.flat());
}

export function useCategoryCounts(open: boolean, tree: MaterialCategory[]) {
  const [counts, setCounts] = useState<Record<string, number> | null>(null);
  useEffect(() => {
    if (!open) return;
    let live = true;
    setCounts(null);
    loadCodeCounts(tree).then(next => live && setCounts(next)).catch(() => {});
    return () => { live = false; };
  }, [open, tree]);
  return counts;
}
