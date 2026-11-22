import { z } from "zod";
import { FetchError, apiFetch } from "@/lib/fetcher";

export type Status = "ACTIVE" | "DRAFT" | "SUSPENDED";
export type Unit = "KG" | "L" | "EA";
export type MaterialGroup = { code: string; label: string; active: boolean };
export type MaterialCategory = { code: string; label: string; active: boolean; groups: MaterialGroup[] };
export type Material = { id: string; name: string; category: string; group: string; imageUrl: string | null; status: Status; unit: string };

const leaf = z.object({ code: z.string(), name: z.string(), is_active: z.boolean() });
const treeSchema = z.object({ items: z.array(leaf.extend({ children: z.array(leaf).nullable().transform(list => list ?? []) })) });
const materialSchema = z.object({
  id: z.string(), name: z.string(), material_group_code: z.string().nullable().optional(), uom_code: z.string(),
  status: z.enum(["ACTIVE", "DRAFT", "SUSPENDED"]), image_url: z.string().nullable().optional(),
});
const pageSchema = z.object({ items: z.array(materialSchema).nullable().transform(list => list ?? []), next_cursor: z.string().nullish() });

export async function catalogRequest<T>(url: string, schema: { parse(value: unknown): T }, init?: RequestInit): Promise<T> {
  const response = await apiFetch(url, { ...init, cache: "no-store" });
  const payload: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const body = (payload ?? {}) as { message?: string; error_code?: string; errors?: { error_code?: string } };
    const error = new FetchError(body.message ?? "", response.status, payload);
    error.code = body.errors?.error_code ?? body.error_code;
    throw error;
  }
  return schema.parse((payload as { data?: unknown } | null)?.data ?? payload);
}

export async function getMaterialTree(): Promise<MaterialCategory[]> {
  const tree = await catalogRequest("/api/inventory/material-categories?include_inactive=true", treeSchema);
  const label = (item: { code: string; name: string; is_active: boolean }) => ({ code: item.code.toLowerCase(), label: item.name, active: item.is_active });
  return tree.items.map(parent => ({ ...label(parent), groups: parent.children.map(label) }));
}

export async function listMaterials(status: Status, tree: MaterialCategory[]): Promise<Material[]> {
  const owner = new Map(tree.flatMap(category => category.groups.map(group => [group.code, category.code] as const)));
  const items: Material[] = [];
  let cursor = "";
  do {
    const query = new URLSearchParams({ kind: "RAW_MATERIAL", status, limit: "100", ...(cursor ? { cursor } : {}) });
    const page = await catalogRequest(`/api/sales/skus?${query}`, pageSchema);
    for (const item of page.items) {
      const group = (item.material_group_code ?? "").toLowerCase();
      items.push({ id: item.id, name: item.name, category: owner.get(group) ?? "", group, imageUrl: item.image_url ?? null, status: item.status, unit: item.uom_code });
    }
    cursor = page.next_cursor ?? "";
  } while (cursor);
  return items;
}
