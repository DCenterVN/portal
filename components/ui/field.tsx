"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Input } from "./input";
import { Label } from "./label";

const control =
  "flex min-h-11 w-full rounded-lg border border-[var(--input)] bg-[var(--card)] px-3 py-2 text-sm text-[var(--foreground)] shadow-sm transition-colors placeholder:text-[var(--muted-foreground)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] disabled:cursor-not-allowed disabled:opacity-50 aria-[invalid=true]:border-[var(--destructive)]";

export interface FieldProps {
  label: string;
  htmlFor: string;
  hint?: string;
  error?: string;
  /** Runs on blur only; a falsy result clears the error. A server `error` wins. */
  validate?: (value: string) => string | undefined;
  children: React.ReactNode;
  className?: string;
}

type Blur = (event: React.FocusEvent<HTMLInputElement>) => void;

// The control gets aria-invalid and aria-describedby pointing at the visible error or hint.
export function Field({ label, htmlFor, hint, error: serverError, validate, children, className }: FieldProps) {
  const [blurError, setBlurError] = React.useState<string>();
  const error = serverError || blurError;
  const own = error ? `${htmlFor}-error` : hint ? `${htmlFor}-hint` : undefined;
  const wired = React.isValidElement<Record<string, unknown>>(children)
    ? React.cloneElement(children, {
        "aria-describedby": [children.props["aria-describedby"], own].filter(Boolean).join(" ") || undefined,
        "aria-invalid": error ? true : children.props["aria-invalid"],
        onBlur: (event: React.FocusEvent<HTMLInputElement>) => {
          (children.props.onBlur as Blur | undefined)?.(event);
          if (validate) setBlurError(validate(event.currentTarget.value) || undefined);
        },
      })
    : children;
  return (
    <div className={cn("grid gap-1.5", className)}>
      <Label htmlFor={htmlFor}>{label}</Label>
      {wired}
      {hint && !error && (
        <p id={`${htmlFor}-hint`} className="text-xs text-[var(--muted-foreground)]">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${htmlFor}-error`} className="text-xs font-medium text-[var(--destructive)]" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

export const TextInput = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(({ className, ...props }, ref) => (
  <Input ref={ref} className={cn(control, "h-auto", className)} {...props} />
));
TextInput.displayName = "TextInput";

export const Select = React.forwardRef<HTMLSelectElement, React.ComponentProps<"select">>(({ className, ...props }, ref) => (
  <select ref={ref} className={cn(control, "pr-8", className)} {...props} />
));
Select.displayName = "Select";

export const Textarea = React.forwardRef<HTMLTextAreaElement, React.ComponentProps<"textarea">>(({ className, ...props }, ref) => (
  <textarea ref={ref} className={cn(control, "min-h-24 resize-y", className)} {...props} />
));
Textarea.displayName = "Textarea";

export interface CheckboxProps extends Omit<React.ComponentProps<"input">, "type"> {
  label: React.ReactNode;
  description?: string;
}

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(({ label, description, className, id, ...props }, ref) => (
  <label
    htmlFor={id}
    className={cn(
      "flex min-h-11 cursor-pointer items-start gap-3 rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 py-2.5 text-sm has-[:checked]:border-[var(--primary)] has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-60",
      className
    )}
  >
    <input ref={ref} id={id} type="checkbox" className="mt-0.5 size-4 accent-[var(--primary)]" {...props} />
    <span className="grid gap-0.5">
      <span className="font-medium text-[var(--foreground)]">{label}</span>
      {description && <span className="text-xs text-[var(--muted-foreground)]">{description}</span>}
    </span>
  </label>
));
Checkbox.displayName = "Checkbox";
