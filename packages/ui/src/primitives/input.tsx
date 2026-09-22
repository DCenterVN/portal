import { forwardRef, type InputHTMLAttributes, type ReactNode } from "react";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  helperText?: string;
  startAdornment?: ReactNode;
  endAdornment?: ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      helperText,
      startAdornment,
      endAdornment,
      id,
      className = "",
      ...props
    },
    ref,
  ) => {
    const inputId = id ?? label.toLowerCase().replace(/\s+/g, "-");
    return (
      <div className="flex flex-col gap-1.5 text-left">
        <label
          htmlFor={inputId}
          className="text-sm font-medium text-[var(--color-ink)]"
        >
          {label}
        </label>
        <div className="relative flex items-center">
          {startAdornment && (
            <div className="pointer-events-none absolute left-3 flex items-center text-[var(--color-muted)]">
              {startAdornment}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            aria-invalid={!!error}
            aria-describedby={error ? `${inputId}-error` : undefined}
            className={`min-h-[44px] w-full rounded-lg border border-[var(--color-line)] bg-[var(--color-panel)] px-3.5 py-2.5 text-sm text-[var(--color-ink)] placeholder:text-[var(--color-muted)] transition-colors focus:border-[var(--color-forest)] focus:outline-none focus:ring-2 focus:ring-[var(--color-forest)]/20 ${
              startAdornment ? "pl-10" : ""
            } ${endAdornment ? "pr-10" : ""} ${
              error ? "border-[var(--color-danger)] focus:border-[var(--color-danger)] focus:ring-[var(--color-danger)]/20" : ""
            } ${className}`}
            {...props}
          />
          {endAdornment && (
            <div className="absolute right-3 flex items-center text-[var(--color-muted)]">
              {endAdornment}
            </div>
          )}
        </div>
        {error ? (
          <p
            id={`${inputId}-error`}
            role="alert"
            className="text-xs text-[var(--color-danger)]"
          >
            {error}
          </p>
        ) : helperText ? (
          <p className="text-xs text-[var(--color-muted)]">{helperText}</p>
        ) : null}
      </div>
    );
  },
);

Input.displayName = "Input";
