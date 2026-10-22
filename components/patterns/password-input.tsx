"use client";

import * as React from "react";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export function PasswordInput({ className, disabled, ...props }: Omit<React.ComponentProps<"input">, "type">) {
  const [shown, setShown] = React.useState(false);
  return (
    <div className="relative">
      <Input {...props} type={shown ? "text" : "password"} disabled={disabled} className={cn("h-10 pr-11", className)} />
      <Button type="button" variant="ghost-icon" size="icon" disabled={disabled} aria-pressed={shown}
        aria-label={shown ? "Ẩn mật khẩu" : "Hiện mật khẩu"} onClick={() => setShown((v) => !v)}
        className="absolute right-0 top-0 size-10 focus-visible:ring-0 after:absolute after:left-1/2 after:top-1/2 after:size-5 after:-translate-x-1/2 after:-translate-y-1/2 after:content-[''] focus-visible:after:outline focus-visible:after:outline-1 focus-visible:after:outline-[var(--color-focus)]">
        {shown ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}
      </Button>
    </div>
  );
}
