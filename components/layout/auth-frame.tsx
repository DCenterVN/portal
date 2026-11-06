import type { ReactNode } from "react";
import Link from "next/link";
import type { Route } from "next";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export type AuthFrameProps = {
  /** Journey marker written to `data-auth-journey`; each journey shell passes its own literal. */
  scope: string;
  brand: string;
  brandLabel?: string;
  brandHref: Route;
  skipLabel: string;
  footer: string;
  /** Popup body: only the card, no page chrome (the Dialog supplies the surface). */
  bare?: boolean;
  children: ReactNode;
};

function Brand({ brand, label, href }: { brand: string; label?: string; href: Route }) {
  return (
    <Link href={href} aria-label={label} className="inline-flex min-h-11 items-center text-lg font-semibold text-foreground">
      {brand}
    </Link>
  );
}

function AuthCard({ brand, brandLabel, brandHref, bare, children }: Pick<AuthFrameProps, "brand" | "brandLabel" | "brandHref" | "bare" | "children">) {
  return (
    <Card className={cn("w-full max-w-sm gap-0 p-0", bare && "max-w-none rounded-none border-0")}>
      <div className="min-w-0 space-y-4 p-6">
        <Brand brand={brand} label={brandLabel} href={brandHref} />
        {children}
      </div>
    </Card>
  );
}

// One sign-in/recovery frame for both the customer and the staff journey: a single centred card, no colour panel. Copy arrives as props, so the shell that owns the journey also owns its message namespace.
export function AuthFrame({ scope, skipLabel, footer, bare, ...card }: AuthFrameProps) {
  if (bare) return <AuthCard bare {...card} />;
  return (
    <div data-auth-journey={scope} className="flex min-h-screen flex-col bg-background text-foreground">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-(--z-toast) focus:rounded-lg focus:bg-background focus:p-3 focus-visible:ring-2 focus-visible:ring-ring">
        {skipLabel}
      </a>
      <main id="main" className="grid flex-1 place-items-center px-4 py-10 sm:px-6">
        <AuthCard {...card} />
      </main>
      <footer className="px-4 pb-5 text-center text-xs text-muted-foreground">{footer}</footer>
    </div>
  );
}
