"use client";

import { useState } from "react";
import { Minus, Plus } from "lucide-react";
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput, InputGroupText } from "@/components/ui/input-group";

const grouped = new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 0 });

export function formatWhole(value: number | undefined): string {
  return value === undefined || !Number.isSafeInteger(value) ? "" : grouped.format(value);
}

export type WholeParse = { kind: "empty" } | { kind: "ok"; value: number } | { kind: "error" };

export function parseWhole(text: string): WholeParse {
  const clean = text.trim();
  if (clean === "") return { kind: "empty" };
  if (!/^(\d+|\d{1,3}(\.\d{3})+)$/.test(clean)) return { kind: "error" };
  const value = Number(clean.replaceAll(".", ""));
  return Number.isSafeInteger(value) ? { kind: "ok", value } : { kind: "error" };
}

export interface WholeNumberInputProps {
  label: string;
  name?: string;
  value: number | undefined;
  min: number;
  emptyValue: number | undefined;
  stepper?: { decrease: string; increase: string };
  suffix?: string;
  groupClassName?: string;
  onValue: (value: number | undefined) => void;
}

export function WholeNumberInput({ label, name, value, min, emptyValue, stepper, suffix, groupClassName = "w-40", onValue }: WholeNumberInputProps) {
  const [draft, setDraft] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const current = value !== undefined && Number.isSafeInteger(value) ? value : undefined;
  const step = (delta: number) => { setDraft(null); setMessage(""); onValue(Math.max(min, (current ?? min - 1) + delta)); };
  const input = <InputGroupInput aria-label={label} name={name} type="text" inputMode="numeric" role="spinbutton" aria-valuemin={min} aria-valuenow={current} aria-invalid={message ? true : undefined}
      autoComplete="off" required className={stepper ? "text-center tabular-nums" : "text-right tabular-nums"} value={draft ?? formatWhole(current)}
      onChange={event => {
        const text = event.target.value;
        const parsed = parseWhole(text);
        if (parsed.kind === "error") { setDraft(text); setMessage("Chỉ nhập số nguyên"); return; }
        setDraft(null); setMessage("");
        onValue(parsed.kind === "empty" ? emptyValue : parsed.value);
      }}
      onKeyDown={event => {
        if (event.key !== "ArrowUp" && event.key !== "ArrowDown") return;
        event.preventDefault();
        step(event.key === "ArrowUp" ? 1 : -1);
      }}
      onBlur={() => { setDraft(null); setMessage(""); }} />;
  return <div className="grid gap-1">
    <InputGroup className={groupClassName}>
      {stepper && <InputGroupAddon align="inline-start">
        <InputGroupButton size="icon-xs" aria-label={stepper.decrease} disabled={current === undefined || current <= min} onClick={() => step(-1)}><Minus aria-hidden="true" /></InputGroupButton>
      </InputGroupAddon>}
      {input}
      {stepper && <InputGroupAddon align="inline-end">
        <InputGroupButton size="icon-xs" aria-label={stepper.increase} onClick={() => step(1)}><Plus aria-hidden="true" /></InputGroupButton>
      </InputGroupAddon>}
      {suffix && <InputGroupAddon align="inline-end"><InputGroupText>{suffix}</InputGroupText></InputGroupAddon>}
    </InputGroup>
    {message && <p role="status" className="text-xs text-destructive">{message}</p>}
  </div>;
}
