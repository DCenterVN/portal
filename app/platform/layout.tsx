import { PlatformWorkspace } from "@/features/platform/workspace";

export default function PlatformLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <PlatformWorkspace>{children}</PlatformWorkspace>;
}
