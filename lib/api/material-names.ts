import { apiFetch, FetchError } from "@/lib/fetcher";

const chunkSize = 100;
interface SkuName { id: string; name: string; status?: string }

async function getNamesPage(refs: string[]) {
  const res = await apiFetch(`/api/sales/skus/names?${new URLSearchParams({ sku_refs: refs.join(",") })}`);
  if (!res.ok) throw new FetchError("Không tải được tên hàng", res.status);
  const payload = await res.json();
  return ((payload?.data ?? payload)?.items ?? []) as SkuName[];
}

export async function getMaterialNames(refs: string[]) {
  const unique = [...new Set(refs.filter(Boolean))];
  const chunks = Array.from({ length: Math.ceil(unique.length / chunkSize) }, (_, i) => unique.slice(i * chunkSize, (i + 1) * chunkSize));
  const pages = await Promise.all(chunks.map(getNamesPage));
  return new Map(pages.flat().map(item => [item.id, { name: item.name, status: item.status }] as const));
}
