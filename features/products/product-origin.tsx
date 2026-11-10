"use client";

import { useState } from "react";
import Link from "next/link";
import type { Route } from "next";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function ProductOrigin() {
  const [code, setCode] = useState("");
  return <section aria-labelledby="meal-origin" className="py-1">
    <h2 id="meal-origin" className="text-lg font-semibold">Nguồn gốc</h2>
    <p className="mt-2 text-sm leading-6 text-muted-foreground">Dùng mã truy xuất trên bao bì để xem nguồn nguyên liệu và thông tin lô sản xuất.</p>
    <label htmlFor="meal-trace-code" className="mt-4 block text-sm font-medium">Mã truy xuất trên bao bì</label>
    <div className="mt-2 flex flex-wrap gap-3">
      <Input id="meal-trace-code" value={code} onChange={event => setCode(event.target.value)} placeholder="Nhập mã truy xuất" className="h-11 min-w-0 flex-1 border-0 bg-muted/60 shadow-none focus-visible:ring-1 focus-visible:ring-primary" />
      {code.trim() ? <Link href={`/traceability/${encodeURIComponent(code.trim())}` as Route} className={buttonVariants({ variant: "secondary", className: "h-11 bg-primary/10 text-primary hover:bg-primary/15" })}>Truy xuất nguồn gốc →</Link> : <Button variant="secondary" disabled className="h-11 bg-primary/10 text-primary disabled:opacity-70">Truy xuất nguồn gốc →</Button>}
    </div>
  </section>;
}
