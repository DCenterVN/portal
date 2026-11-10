"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function TraceLookup({ variant = "default" }: { variant?: "default" | "secondary" }) {
  const router = useRouter();
  return <form className="mt-8" onSubmit={event => {
    event.preventDefault();
    const code = String(new FormData(event.currentTarget).get("code") ?? "").trim();
    if (code) router.push(`/traceability/${encodeURIComponent(code)}`);
  }}>
    <label htmlFor="trace-code" className="block text-sm font-medium">Mã truy xuất</label>
    <div className="mt-3 flex flex-col gap-3 sm:flex-row">
      <Input id="trace-code" name="code" required pattern=".*\S.*" maxLength={200} autoCapitalize="none" autoComplete="off" spellCheck={false} placeholder="Ví dụ: TRC-20260901-DEMO" aria-describedby="trace-hint" className="h-14 min-w-0 flex-1 border-0 bg-muted/60 px-4 text-base shadow-none focus-visible:ring-1" />
      <Button type="submit" variant={variant} size="xl" className="shadow-none">Tra cứu</Button>
    </div>
    <p id="trace-hint" className="mt-3 text-sm text-muted-foreground">Mã in trên tem hộp món</p>
  </form>;
}
