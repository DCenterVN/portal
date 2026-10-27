"use client";

import { useState } from "react";
import { Field, TextInput } from "@/components/ui/field";

export function parseReceiptDate(text: string): string {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(text);
  if (!match) return "";
  const [, day, month, year] = match;
  if (Number(year) < 1000) return "";
  const iso = `${year}-${month}-${day}`;
  const date = new Date(`${iso}T12:00:00Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === iso ? iso : "";
}

export function formatReceiptDate(iso: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  return match ? `${match[3]}/${match[2]}/${match[1]}` : "";
}

export function receiptToday(now = new Date()): string {
  return new Intl.DateTimeFormat("sv-SE", { timeZone: "Asia/Ho_Chi_Minh" }).format(now);
}

export interface ReceiptDateInputProps {
  value: string;
  onChange: (iso: string) => void;
  disabled?: boolean;
}

type Edit = { text: string; emitted: string };

export function ReceiptDateInput({ value, onChange, disabled }: ReceiptDateInputProps) {
  const [edit, setEdit] = useState<Edit>({ text: formatReceiptDate(value), emitted: value });
  const [touched, setTouched] = useState(false);
  const text = value === edit.emitted ? edit.text : formatReceiptDate(value);
  const invalid = !parseReceiptDate(text);
  const message = "Nhập ngày hợp lệ theo dd/mm/yyyy.";
  return <Field label="Ngày dự kiến nhập" htmlFor="receipt-date" hint="dd/mm/yyyy. Hợp đồng và giá phải phủ ngày này." error={touched && invalid ? message : undefined}>
    <TextInput id="receipt-date" type="text" inputMode="numeric" placeholder="dd/mm/yyyy" required disabled={disabled} value={text}
      ref={element => element?.setCustomValidity(invalid ? message : "")}
      onChange={event => {
        const next = event.target.value;
        const emitted = parseReceiptDate(next);
        setEdit({ text: next, emitted });
        onChange(emitted);
      }}
      onBlur={() => setTouched(true)} onInvalid={() => setTouched(true)} />
  </Field>;
}
