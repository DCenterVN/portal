"use client";

import * as React from "react";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tip } from "@/components/patterns/tip";
import { cn } from "@/lib/utils";

type PasswordInputProps = Omit<React.ComponentProps<"input">, "type"> & {
  showLabel?: string;
  hideLabel?: string;
};

export function PasswordInput({
  className, disabled, showLabel = "Hiện mật khẩu", hideLabel = "Ẩn mật khẩu", ...props
}: PasswordInputProps) {
  const [shown, setShown] = React.useState(false);
  return (
    <div className="relative">
      <Input {...props} type={shown ? "text" : "password"} disabled={disabled} className={cn("pr-10", className)} />
      <Tip label={shown ? hideLabel : showLabel}><Button type="button" variant="ghost" size="icon" disabled={disabled} aria-pressed={shown}
        aria-label={shown ? hideLabel : showLabel} onClick={() => setShown((v) => !v)}
        className="absolute right-0 top-0 size-9 focus-visible:ring-0 after:absolute after:left-1/2 after:top-1/2 after:size-5 after:-translate-x-1/2 after:-translate-y-1/2 after:content-[''] focus-visible:after:outline focus-visible:after:outline-1 focus-visible:after:outline-[var(--color-focus)]">
        {shown ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}
      </Button></Tip>
    </div>
  );
}
