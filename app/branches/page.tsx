import { BranchesView } from "@/features/branches/branches-view";
import { SAMPLE_BRANCHES } from "@/components/navbar";

export const metadata = {
  title: "Danh sách Chi nhánh — ColdChain HQ",
  description: "Chọn chi nhánh cấp đông để chuyển đổi ngữ cảnh làm việc và quản lý kho hàng",
};

export default function BranchesPage() {
  return <BranchesView initialBranches={SAMPLE_BRANCHES} />;
}
