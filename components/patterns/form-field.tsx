"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Checkbox as CheckboxControl } from "@/components/ui/checkbox";
import { Field as FieldRoot, FieldContent, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field";

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
    <FieldRoot data-invalid={error ? true : undefined} className={cn("gap-1.5", className)}>
      <FieldLabel htmlFor={htmlFor}>{label}</FieldLabel>
      {wired}
      {hint && !error && (
        <FieldDescription id={`${htmlFor}-hint`} className="text-xs">
          {hint}
        </FieldDescription>
      )}
      {error && <FieldError id={`${htmlFor}-error`} className="text-xs font-medium">{error}</FieldError>}
    </FieldRoot>
  );
}

export interface CheckboxProps
  extends Omit<React.ComponentProps<typeof CheckboxControl>, "onChange" | "onCheckedChange" | "type"> {
  label: React.ReactNode;
  description?: string;
  /** Same shape as the old native checkbox: callers read `event.target.checked`. */
  onChange?: (event: { target: { checked: boolean } }) => void;
}

// shadcn Checkbox + label; inside a <form> Radix emits the hidden input, so name/value/defaultChecked still reach FormData.
export function Checkbox({ label, description, className, id, onChange, ...props }: CheckboxProps) {
  const auto = React.useId();
  const key = id ?? auto;
  return (
    <FieldRoot orientation="horizontal" className={cn("items-start gap-2 text-sm", className)}>
      <CheckboxControl id={key} className="mt-0.5" onCheckedChange={(next) => onChange?.({ target: { checked: next === true } })} {...props} />
      <FieldContent className="gap-0.5">
        <FieldLabel htmlFor={key} className="cursor-pointer font-medium">{label}</FieldLabel>
        {description && <FieldDescription className="text-xs">{description}</FieldDescription>}
      </FieldContent>
    </FieldRoot>
  );
}
