"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CatalogArtwork } from "./catalog-artwork";

export function ProductGallery({ name, images = [] }: { name: string; images?: string[] }) {
  const [selected, setSelected] = useState(0);
  const [failed, setFailed] = useState<string[]>([]);
  const cover = images[selected];
  return <div className="min-w-0 space-y-3">
    <div className="aspect-[4/3] overflow-hidden rounded-lg bg-media">
      {cover && !failed.includes(cover) ? <img src={cover} alt={name} className="aspect-[4/3] w-full object-cover" onError={() => setFailed(previous => [...previous, cover])} /> : <CatalogArtwork name={name} />}
    </div>
    {images.length > 1 && <div aria-label="Ảnh món" className="flex gap-3 overflow-x-auto p-1">
      {images.map((src, index) => <Button key={`${src}-${index}`} variant="ghost" aria-label={`Xem ảnh ${index + 1}`} aria-pressed={selected === index} onClick={() => setSelected(index)} className="h-16 w-20 shrink-0 overflow-hidden rounded-[var(--r-6)] p-0 aria-pressed:ring-2 aria-pressed:ring-ring">
        {src && !failed.includes(src) ? <img src={src} alt="" className="size-full object-cover" onError={() => setFailed(previous => [...previous, src])} /> : <CatalogArtwork name={name} />}
      </Button>)}
    </div>}
  </div>;
}
