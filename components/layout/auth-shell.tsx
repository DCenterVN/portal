import Link from "next/link";
import { Leaf, QrCode, ShieldCheck, Snowflake } from "lucide-react";

const PROMISES = [
  { icon: Snowflake, text: "Chuỗi lạnh giám sát từ kho tới tay bạn" },
  { icon: QrCode, text: "Mỗi lô hàng tra được nguồn gốc" },
  { icon: ShieldCheck, text: "Tài khoản bảo vệ bằng xác thực phiên an toàn" },
];

export function AuthShell({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return (
    <main className="min-h-screen grid lg:grid-cols-12 bg-[var(--background)] text-[var(--foreground)]">
      <aside className="hidden lg:flex lg:col-span-5 flex-col justify-between p-12 bg-[var(--primary)] text-[var(--primary-foreground)]">
        <Link href="/" className="flex items-center gap-2 font-serif text-xl font-bold">
          <Leaf aria-hidden="true" className="size-6" /> Việt Sạch
        </Link>
        <div className="space-y-6">
          <p className="font-serif text-3xl font-bold leading-tight">Tươi là một cảm giác.<br />Sạch là điều kiểm chứng được.</p>
          <ul className="space-y-3 text-sm">
            {PROMISES.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-3"><Icon aria-hidden="true" className="size-4 shrink-0" />{text}</li>
            ))}
          </ul>
        </div>
        <p className="text-xs opacity-80">© 2026 Việt Sạch</p>
      </aside>
      <section className="lg:col-span-7 flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md space-y-6">
          <Link href="/" className="lg:hidden flex items-center justify-center gap-2 font-serif text-lg font-bold text-[var(--primary)]">
            <Leaf aria-hidden="true" className="size-5" /> Việt Sạch
          </Link>
          <header className="space-y-1.5 text-center">
            <h1 className="font-serif text-2xl font-bold">{title}</h1>
            <p className="text-sm text-[var(--muted-foreground)]">{description}</p>
          </header>
          {children}
        </div>
      </section>
    </main>
  );
}
