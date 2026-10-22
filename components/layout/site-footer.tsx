import Link from "next/link";
import type { Route } from "next";

export type SiteFooterContent = {
  columns: { title: string; links: { href: string; label: string }[] }[];
  legal: string[];
};

export function SiteFooter({ footer }: { footer: SiteFooterContent }) {
  return (
    <footer className="[--footer-ink:var(--color-primary-ink)] dark:[--footer-ink:var(--color-ink)] bg-[var(--color-chrome)] px-4 py-7 text-[color-mix(in_srgb,var(--footer-ink)_80%,transparent)] md:px-6 lg:px-8">
      <div className="mx-auto grid w-full max-w-screen-xl grid-cols-2 gap-5 lg:grid-cols-[1.4fr_repeat(3,1fr)]">
        {footer.columns.map((column) => (
          <section key={column.title}>
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-[var(--color-sun)]">{column.title}</h2>
            <ul className="space-y-1 text-sm">
              {column.links.map((link) => (
                <li key={link.href}>
                  <Link className="inline-flex min-h-11 items-center hover:text-[var(--footer-ink)] hover:underline" href={link.href as Route}>{link.label}</Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
      <div className="mx-auto mt-6 flex w-full max-w-screen-xl flex-wrap gap-x-5 gap-y-2 border-t border-[color-mix(in_srgb,var(--footer-ink)_12%,transparent)] pt-4 text-xs">
        {footer.legal.map((item) => <span key={item}>{item}</span>)}
      </div>
    </footer>
  );
}
