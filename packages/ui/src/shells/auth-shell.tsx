import type { ReactNode } from "react";

export interface AuthShellProps {
  children: ReactNode;
  logo?: ReactNode;
}

export function AuthShell({ children, logo }: AuthShellProps) {
  return (
    <div className="relative min-h-dvh flex flex-col items-center justify-center bg-[var(--color-bg)] p-4 sm:p-6 lg:p-8 overflow-x-hidden">
      {/* Abstract Ambient Background Mesh from Stitch */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden opacity-60 dark:opacity-40">
        <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] max-w-[650px] max-h-[650px] rounded-full bg-[var(--color-rice)]/20 dark:bg-[#2D5A27]/35 blur-[120px] mix-blend-screen" />
        <div className="absolute bottom-[-15%] right-[-10%] w-[60vw] h-[60vw] max-w-[750px] max-h-[750px] rounded-full bg-[var(--color-sun)]/15 dark:bg-[#333531]/50 blur-[150px]" />
        <div className="absolute top-[30%] right-[15%] w-[35vw] h-[40vw] max-w-[500px] max-h-[500px] rounded-full bg-[var(--color-earth)]/12 dark:bg-[#D97707]/20 blur-[100px] opacity-40" />
      </div>

      {logo && <div className="relative z-10 mb-6 flex justify-center">{logo}</div>}

      <div className="relative z-10 w-full flex items-center justify-center">
        {children}
      </div>
    </div>
  );
}
