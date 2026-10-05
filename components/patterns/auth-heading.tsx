type Props = {
  title: string;
  subtitle?: string;
};

export function AuthHeading({ title, subtitle }: Props) {
  return (
    <header className="mb-6 space-y-2 text-center">
      <h1 className="font-serif text-2xl font-bold tracking-tight">{title}</h1>
      {subtitle && <p className="text-sm text-[var(--muted-foreground)]">{subtitle}</p>}
    </header>
  );
}
