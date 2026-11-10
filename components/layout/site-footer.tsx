import Link from "next/link";
import type { Route } from "next";

export type SiteFooterContent = {
  columns: { title: string; links: { href: string; label: string }[] }[];
  legal: string[];
};

export function SiteFooter({ footer }: { footer: SiteFooterContent }) {
  return (
    <footer className="mt-12 bg-muted/40 px-4 py-12 text-muted-foreground md:px-10">
      <div className="mx-auto grid w-full max-w-340 grid-cols-2 gap-8 lg:grid-cols-[1.4fr_repeat(3,1fr)]">
        {footer.columns.map((column) => (
          <section key={column.title}>
            <h2 className="mb-3 text-sm font-medium text-foreground">{column.title}</h2>
            <ul className="space-y-1 text-sm">
              {column.links.map((link) => (
                <li key={link.href}>
                  <Link className="inline-flex min-h-11 items-center hover:text-foreground hover:underline" href={link.href as Route}>{link.label}</Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
      <div className="mx-auto mt-10 flex w-full max-w-340 flex-wrap gap-x-5 gap-y-2 text-xs">
        {footer.legal.map((item) => <span key={item}>{item}</span>)}
      </div>
    </footer>
  );
}
