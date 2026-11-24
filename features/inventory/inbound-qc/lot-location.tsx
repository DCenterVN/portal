import type { StorageLocation } from "@/lib/api/storage-locations";

export function LotLocation({ code, catalog }: { code: string; catalog: Record<string, StorageLocation> | undefined }) {
  const value = code.trim();
  if (!value) return <span className="text-muted-foreground">Chưa gán</span>;
  const found = catalog?.[value];
  if (!found) return <span className="break-all text-muted-foreground" title={catalog ? "Mã cũ, chưa có trong danh mục" : undefined}>{value}</span>;
  return <span className="flex min-w-0 items-baseline gap-1.5"><span className="font-semibold">{found.code}</span>{found.name && <span className="truncate">{found.name}</span>}</span>;
}
