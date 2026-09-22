export default function OpsNestedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="mx-auto max-w-7xl">{children}</div>;
}
