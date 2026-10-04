import { LiveConsole } from "@/features/console/live-console";

export const metadata = {
  title: "Console Vận hành — DCenter Portal",
  description: "Bảng điều khiển quản trị IAM, chi nhánh và hệ thống vận hành",
};

export default function ConsolePage() {
  return <LiveConsole />;
}
