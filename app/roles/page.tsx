import { RolesView, ROLES, PERMISSION_CATALOG } from "@/features/roles/roles-view";

export const metadata = {
  title: "Vai trò & Phân quyền — ColdChain HQ",
  description: "Ma trận vai trò và kiểm soát quyền hạn vận hành chi nhánh DCenterVN",
};

export default function RolesPage() {
  return <RolesView initialRoles={ROLES} initialPermissions={PERMISSION_CATALOG} />;
}
