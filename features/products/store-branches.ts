import { z } from "zod";
import { decodePlatform } from "@/lib/api/platform-contract";

export type StoreBranch = { id: string; name: string; kind: string };

const kinds: Record<string, string> = { STORE: "Cửa hàng", CENTRAL_KITCHEN: "Bếp trung tâm" };
const orgBranches = z.object({ items: z.array(z.object({ id: z.string().uuid(), name: z.string().trim().min(1), type: z.string() })) });

export function storeBranches(body: unknown): StoreBranch[] {
  const { items } = decodePlatform(body, orgBranches);
  return items
    .map(({ id, name, type }) => ({ id, name, kind: kinds[type] ?? "Chi nhánh" }))
    .sort((a, b) => Number(b.kind === "Cửa hàng") - Number(a.kind === "Cửa hàng") || a.name.localeCompare(b.name, "vi"));
}
