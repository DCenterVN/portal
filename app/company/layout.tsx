import { CompanyWorkspace } from "@/features/platform/workspace";

export default function CompanyLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <CompanyWorkspace>{children}</CompanyWorkspace>;
}
