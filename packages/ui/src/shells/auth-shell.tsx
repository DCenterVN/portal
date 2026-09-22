import type { ReactNode } from "react";

export interface AuthShellProps {
  children: ReactNode;
  logo?: ReactNode;
}

export function AuthShell({ children, logo }: AuthShellProps) {
  return (
    <div className="relative min-h-dvh flex flex-col items-center justify-center bg-[var(--color-bg)] p-4 sm:p-6 lg:p-8 overflow-x-hidden">
      {/* Ambient background decoration */}
      <div className="absolute top-0 left-1/4 -translate-y-1/2 w-96 h-96 bg-[var(--color-teal)]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 translate-y-1/2 w-96 h-96 bg-[var(--color-gold)]/10 rounded-full blur-3xl pointer-events-none" />

      {logo && <div className="relative z-10 mb-6 flex justify-center">{logo}</div>}

      <div className="relative z-10 w-full flex items-center justify-center">
        {children}
      </div>
    </div>
  );
}
