import type { Metadata } from "next";
import type { ReactNode } from "react";
import { ConsoleFrame } from "@/features/console/console-frame";

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default function ConsoleLayout({ children }: { children: ReactNode }) {
  return <ConsoleFrame>{children}</ConsoleFrame>;
}
