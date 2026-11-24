import type { Route } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { Suspense } from "react";
import { StoreFrame } from "@/features/store/store-frame";
import { ConsoleFrame } from "@/features/console/console-frame";
import { AuthPopup } from "@/features/customer-auth/auth-popup";
import { CustomerAuthPopupBody } from "@/components/layout/customer-auth-shell";

function Body({ href, label }: { href: Route; label: string }) {
  return (
    <section className="mx-auto max-w-2xl px-4 py-16 text-center">
      <h1 className="text-3xl font-semibold">Không tìm thấy trang</h1>
      <p className="mt-4">Trang bạn đang tìm không tồn tại hoặc đã được chuyển.</p>
      <Link className="mt-6 inline-block underline" href={href}>
        {label}
      </Link>
    </section>
  );
}

export default async function NotFound() {
  const jar = await cookies();
  const employee = jar.get("portal_plane")?.value === "employee" &&
    (jar.has("access_token") || jar.has("refresh_token") || jar.has("__Host-refresh_token"));
  if (employee) return <ConsoleFrame><Body href="/console" label="Về trang quản trị" /></ConsoleFrame>;
  return (
    <StoreFrame authPopup={<Suspense><AuthPopup signedIn={false} Shell={CustomerAuthPopupBody} /></Suspense>}>
      <Body href="/" label="Về trang chủ" />
    </StoreFrame>
  );
}
