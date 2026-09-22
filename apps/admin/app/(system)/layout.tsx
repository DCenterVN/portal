import { AppShell } from "@dcentervn/ui";

export default function SystemLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AppShell sidebar={<nav aria-label="Quản trị hệ thống" />} title="Hệ thống Việt Sạch">
      {children}
    </AppShell>
  );
}
