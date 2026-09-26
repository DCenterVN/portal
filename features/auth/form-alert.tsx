export function FormAlert({ children }: { children: React.ReactNode }) {
  return (
    <p role="alert" className="rounded-xl border border-[var(--destructive)] bg-[var(--background)] p-3 text-sm text-[var(--destructive)]">
      {children}
    </p>
  );
}

export function FormNotice({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div role="status" className="space-y-2 rounded-xl border border-[var(--border)] bg-[var(--card)] p-6 text-center">
      <h2 className="font-serif text-lg font-bold text-[var(--primary)]">{title}</h2>
      <div className="space-y-3 text-sm text-[var(--muted-foreground)]">{children}</div>
    </div>
  );
}
