import { BranchConsole } from "@/features/console/branch-console";
import { getInitialConsoleData } from "@/lib/mock-data";

export const metadata = {
  title: "Console Vận hành — DCenter Portal",
  description: "Bảng điều khiển quản trị IAM, chi nhánh và hệ thống vận hành",
};

export default function ConsolePage() {
  const initialData = getInitialConsoleData();
  return <BranchConsole initialData={initialData} />;
}
