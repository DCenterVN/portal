const both = ["CENTRAL_KITCHEN", "STORE"];
const kitchen = ["CENTRAL_KITCHEN"];

const role = (code: string, name: string, branch_types: string[], description = "", sort_order = 0, isProtected = false) => ({ code, name, description, sort_order, protected: isProtected, branch_types });

export const realRoles = [
  role("ADMIN", "Quản trị hệ thống", kitchen, "Toàn quyền", 1, true),
  role("FOOD_DEV", "Dinh dưỡng", kitchen, "", 2),
  role("PROCESSING_STAFF", "Chế biến", kitchen, "", 3),
  role("SALES", "Bán hàng", both, "Tạo sản phẩm, gói bán, bảng giá", 4),
  role("WAREHOUSE", "Kho", both, "", 5),
];

export const oneRole = [role("SALES", "Bán hàng", both, "Tạo sản phẩm, gói bán, bảng giá", 4)];
export const twoRoles = [role("SALES", "Bán hàng", both, "", 4), role("WAREHOUSE", "Kho", both, "", 5)];
export const thirtyRoles = Array.from({ length: 30 }, (_, index) => role(`MAU_${index + 1}`, `Vai trò mẫu ${index + 1}`, both, "", index + 1));

export const roleEnvelope = (items: readonly unknown[]) => ({ code: 200, status: "success", message: "OK", data: { items } });
