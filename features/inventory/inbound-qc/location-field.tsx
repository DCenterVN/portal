"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import useSWR from "swr";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "@/components/ui/toast";
import { EntityPicker } from "@/components/patterns/entity-picker";
import { useAccess } from "@/lib/access-boundary";
import { createStorageLocation, getStorageLocations, type StorageLocation } from "@/lib/api/storage-locations";
import { ZoneBadge } from "../storage-locations/zone-badge";
import { StorageLocationForm } from "../storage-locations/storage-location-form";

export const legacyLocation = (code: string): StorageLocation => ({ id: code, code, name: "", zone: "", active: true });

export function locationOptions(active: StorageLocation[], currentCode: string) {
  const code = currentCode.trim();
  return code && !active.some(item => item.code === code) ? [legacyLocation(code), ...active] : active;
}

export async function addAndPick(values: { code: string; name: string; zone: string }, deps: { create: typeof createStorageLocation; refresh: () => Promise<unknown>; pick: (code: string) => void }) {
  const made = await deps.create(values);
  await deps.refresh();
  deps.pick(made.code);
}

function LocationOption({ item, legacy }: { item: StorageLocation; legacy: boolean }) {
  return <span className="grid min-w-0 gap-0.5 py-0.5">
    <span className="flex min-w-0 items-center gap-2">
      <span className="font-semibold">{item.code}</span>
      {item.name && <span className="min-w-0 flex-1 truncate text-sm">{item.name}</span>}
      {item.zone && <ZoneBadge zone={item.zone} className="ml-auto" />}
    </span>
    {legacy && <span className="text-xs text-muted-foreground">Mã cũ, chọn lại vị trí trong danh mục</span>}
  </span>;
}

type Props = { current: string; busy: boolean; submitLabel: string; onSubmit: (code: string) => void };

export function LocationField({ current, busy, submitLabel, onSubmit }: Props) {
  const { can } = useAccess();
  const { data, error, mutate } = useSWR("storage-locations-active", () => getStorageLocations({ active: true, page: 1, limit: 100 }));
  const [picked, setPicked] = useState(current.trim());
  const [adding, setAdding] = useState(false);
  const active = data?.items ?? [];
  const items = locationOptions(active, current);
  const status = error ? "error" : data ? "ready" : "loading";
  const legacy = current.trim() !== "" && !active.some(item => item.code === current.trim());
  const create = async (values: { code: string; name: string; zone: string }) => {
    await addAndPick(values, { create: createStorageLocation, refresh: mutate, pick: setPicked });
    setAdding(false);
    toast.success("Đã thêm vị trí kho");
  };
  return <>
    <form className="grid gap-4" onSubmit={event => { event.preventDefault(); if (picked && !busy) onSubmit(picked); }}>
    <EntityPicker label="Vị trí kho" name="lot-location" serializeValue={false} items={items} status={status} onRetry={() => void mutate()}
      placeholder="Chọn vị trí kho" searchPlaceholder="Tìm theo mã hoặc tên" emptyText="Chi nhánh chưa có vị trí kho nào"
      getId={item => item.code} getLabel={item => item.code} getMeta={item => item.name} renderOption={item => <LocationOption item={item} legacy={legacy && item.code === current.trim()} />}
      value={picked || null} onChange={code => setPicked(code ?? "")} required
      footer={can("inventory:lot:update") ? close => <Button type="button" variant="ghost" size="sm" className="w-full justify-start" onClick={() => { close(); setAdding(true); }}><Plus aria-hidden="true" />Thêm vị trí mới</Button> : undefined} />
    {status === "ready" && items.length === 0 && <p className="text-sm text-muted-foreground">Quản lý danh mục ở màn <Link className="font-medium text-primary underline-offset-4 hover:underline" href="/inventory/storage-locations">Vị trí kho</Link>.</p>}
    <div className="flex justify-end"><Button type="submit" disabled={!picked || busy}>{busy ? "Đang lưu…" : submitLabel}</Button></div>
  </form>
    <Dialog open={adding} onOpenChange={setAdding}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle>Thêm vị trí mới</DialogTitle><DialogDescription>Vị trí mới được chọn ngay cho lô này.</DialogDescription></DialogHeader>
        <StorageLocationForm submitLabel="Thêm và chọn" onSubmit={create} onCancel={() => setAdding(false)} />
      </DialogContent>
    </Dialog>
  </>;
}
