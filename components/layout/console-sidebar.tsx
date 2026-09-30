import Link from "next/link";
import type { Route } from "next";
import { Circle, Sun } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import type { ShellNavGroup } from "./console-shell";

type Props = {
  id: string;
  collapsed: boolean;
  pathname: string;
  nav: ShellNavGroup[];
  context: { label: string; sublabel?: string };
  user: { name: string; detail?: string };
  logo: ReactNode;
};

export function ConsoleSidebar({ id, collapsed, pathname, nav, context, user, logo }: Props) {
  return (
    <aside
      id={id}
      className={cn(
        "flex min-h-screen flex-col overflow-hidden bg-[var(--color-chrome)] text-[color:color-mix(in_srgb,white_85%,transparent)] transition-[width] motion-reduce:transition-none",
        collapsed ? "w-17" : "w-60"
      )}
    >
      <div className={cn("flex min-h-16 items-center", collapsed ? "justify-center px-2" : "gap-3 px-4")}>
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[color:color-mix(in_srgb,white_8%,transparent)] text-[var(--color-sun)]">
          {logo}
        </span>
      </div>

      <div className={cn("mx-3 mb-4 rounded-xl bg-[color:color-mix(in_srgb,white_8%,transparent)]", collapsed ? "flex justify-center p-2" : "p-3")}>
        <div className={cn("flex items-start", collapsed ? "justify-center" : "gap-3")}>
          <Sun className="mt-0.5 size-4 shrink-0 text-[var(--color-sun)]" aria-hidden="true" />
          <div className={collapsed ? "sr-only" : "min-w-0"}>
            <p className="truncate text-sm font-semibold text-[color:white]">{context.label}</p>
            {context.sublabel && <p className="truncate text-xs text-[color:color-mix(in_srgb,white_70%,transparent)]">{context.sublabel}</p>}
          </div>
        </div>
      </div>

      <nav className="flex-1 space-y-5 px-2">
        {nav.map((group) => (
          <section key={group.title}>
            <h2 className={cn("px-2 pb-1 text-xs font-semibold uppercase tracking-widest text-[color:color-mix(in_srgb,white_55%,transparent)]", collapsed && "sr-only")}>
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
                        "flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm transition-colors hover:bg-[color:color-mix(in_srgb,white_8%,transparent)]",
                        active ? "bg-[color:color-mix(in_srgb,white_12%,transparent)] font-semibold text-[color:white]" : "text-[color:color-mix(in_srgb,white_85%,transparent)]",
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

      <div className={cn("mt-4 border-t border-[color:color-mix(in_srgb,white_12%,transparent)]", collapsed ? "flex justify-center px-2 py-3" : "px-4 py-4")}>
        <div className={cn("flex min-w-0 items-center", collapsed ? "justify-center" : "gap-3")}>
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[color:color-mix(in_srgb,white_12%,transparent)] text-sm font-semibold text-[color:white]">
            {user.name.slice(0, 1)}
          </span>
          <div className={collapsed ? "sr-only" : "min-w-0"}>
            <p className="truncate text-sm font-semibold text-[color:white]">{user.name}</p>
            {user.detail && <p className="truncate text-xs text-[color:color-mix(in_srgb,white_65%,transparent)]">{user.detail}</p>}
          </div>
        </div>
      </div>
    </aside>
  );
}
