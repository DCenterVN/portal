import { LiveConsole } from "@/features/console/live-console";

export const metadata = {
  title: "Tổng quan",
  description: "Việc cần xử lý tại chi nhánh đang làm việc",
};

export default function ConsolePage() {
  return <LiveConsole />;
}
