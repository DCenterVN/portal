import Link from "next/link";
import type { Route } from "next";
import { Circle, Building2 } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import type { ShellNavGroup } from "./console-shell";

type Props = {
  id: string;
  collapsed: boolean;
  pathname: string;
  nav: ShellNavGroup[];
  context: { label: string; sublabel?: string };
  // ponytail: ignored (avatar lives in the top bar); kept because app/rebrand.test.ts S3 still passes it. Drop with that test.
  user?: { name: string; detail?: string };
  logo: ReactNode;
};

export function ConsoleSidebar({ id, collapsed, pathname, nav, context, logo }: Props) {
  return (
    <aside
      id={id}
      className={cn(
        "flex min-h-screen flex-col overflow-hidden border-r border-line bg-[var(--color-surface)] text-[var(--color-ink)] transition-[width] motion-reduce:transition-none",
        collapsed ? "w-17" : "w-60"
      )}
    >
      <div className={cn("flex min-h-16 items-center", collapsed ? "justify-center px-2" : "gap-3 px-4")}>
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[var(--color-tint)] text-[var(--color-primary)]">
          {logo}
        </span>
      </div>

      <div className={cn("mx-3 mb-4 rounded-xl bg-[var(--color-tint)]", collapsed ? "flex justify-center p-2" : "p-3")}>
        <div className={cn("flex items-start", collapsed ? "justify-center" : "gap-3")}>
          <Building2 className="mt-0.5 size-4 shrink-0 text-[var(--color-primary)]" aria-hidden="true" />
          <div className={collapsed ? "sr-only" : "min-w-0"}>
            <p className="truncate text-sm font-semibold text-[var(--color-ink)]">{context.label}</p>
            {context.sublabel && <p className="truncate text-xs text-[var(--color-muted)]">{context.sublabel}</p>}
          </div>
        </div>
      </div>

      <nav aria-label="Điều hướng quản trị" className="flex-1 space-y-5 px-2 pb-4">
        {nav.map((group) => (
          <section key={group.title}>
            <h2 className={cn("px-2 pb-1 text-xs font-semibold uppercase tracking-widest text-[var(--color-muted)]", collapsed && "sr-only")}>
              {group.title}
            </h2>
            <ul className="space-y-1">
              {group.items.map((item) => {
                const active = pathname === item.match || pathname.startsWith(`${item.match}/`);
                const Icon = item.icon ?? Circle;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href as Route}
                      aria-current={active ? "page" : undefined}
                      title={collapsed ? item.label : undefined}
                      className={cn(
                        "flex min-h-11 items-center gap-3 rounded-lg border-l-2 border-l-transparent px-3 text-sm transition-colors duration-150 ease-out motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--color-focus)] hover:bg-[var(--color-tint)]",
                        active ? "border-l-[var(--color-primary)] bg-[var(--color-tint)] font-semibold text-[var(--color-ink)]" : "text-[var(--color-ink)]",
                        collapsed && "justify-center px-2"
                      )}
                    >
                      <Icon className="size-4 shrink-0" aria-hidden="true" />
                      <span className={collapsed ? "sr-only" : "truncate"}>{item.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </nav>
    </aside>
  );
}
