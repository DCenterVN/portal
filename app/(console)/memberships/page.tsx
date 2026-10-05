import { MembershipsView } from "@/features/memberships/memberships-view";

export const metadata = {
  title: "Quản lý Thành viên — ColdChain HQ",
  description: "Phân quyền nhân sự và kiểm soát vai trò chi nhánh DCenterVN",
};

export default function MembershipsPage() {
  return <MembershipsView initialEmployees={[]} />;
}
