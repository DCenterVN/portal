"use client";

import { useState } from "react";
import { Minus, Plus } from "lucide-react";
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from "@/components/ui/input-group";
import { formatQuantity, toMilli } from "@/lib/stock-transfer";

export function parseQuantity(text: string): number | null {
  if (text.trim() === "") return 0;
  const milli = toMilli(text.replace(/[.,]$/, ""));
  return milli === null ? null : milli / 1000;
}

export interface QuantityInputProps {
  label: string;
  value: number;
  stepper: { decrease: string; increase: string };
  groupClassName?: string;
  onValue: (value: number) => void;
}

export function QuantityInput({ label, value, stepper, groupClassName = "w-40", onValue }: QuantityInputProps) {
  const [draft, setDraft] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const step = (delta: number) => { setDraft(null); setMessage(""); onValue(Math.max(0, Math.round((value + delta) * 1000) / 1000)); };
  return <div className="grid gap-1">
    <InputGroup className={groupClassName}>
      <InputGroupAddon align="inline-start"><InputGroupButton size="icon-xs" aria-label={stepper.decrease} disabled={value <= 1} onClick={() => step(-1)}><Minus aria-hidden="true" /></InputGroupButton></InputGroupAddon>
      <InputGroupInput aria-label={label} type="text" inputMode="decimal" role="spinbutton" aria-valuenow={value} aria-invalid={message ? true : undefined} autoComplete="off" required className="text-center tabular-nums"
        value={draft ?? (value > 0 ? formatQuantity(value) : "")}
        onChange={event => {
          const text = event.target.value;
          const parsed = parseQuantity(text);
          if (parsed === null) { setDraft(text); setMessage("Nhập số, tối đa 3 số lẻ"); return; }
          setDraft(text.trim() === "" ? null : text); setMessage("");
          onValue(parsed);
        }}
        onKeyDown={event => {
          if (event.key !== "ArrowUp" && event.key !== "ArrowDown") return;
          event.preventDefault();
          step(event.key === "ArrowUp" ? 1 : -1);
        }}
        onBlur={() => { setDraft(null); setMessage(""); }} />
      <InputGroupAddon align="inline-end"><InputGroupButton size="icon-xs" aria-label={stepper.increase} onClick={() => step(1)}><Plus aria-hidden="true" /></InputGroupButton></InputGroupAddon>
    </InputGroup>
    {message && <p role="status" className="text-xs text-destructive">{message}</p>}
  </div>;
}
