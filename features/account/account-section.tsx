import type { ReactNode } from "react";

type AccountSectionProps = { title: string; description: string; children: ReactNode };

export function AccountSection({ title, description, children }: AccountSectionProps) {
  return <section className="space-y-3">
    <div>
      <h2 className="text-sm font-medium">{title}</h2>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
    {children}
  </section>;
}
