const both = ["CENTRAL_KITCHEN", "STORE"];
const kitchen = ["CENTRAL_KITCHEN"];

export const realRoles = [
  { code: "ADMIN", name: "Quản trị hệ thống", branch_types: kitchen },
  { code: "FOOD_DEV", name: "Dinh dưỡng", branch_types: kitchen },
  { code: "PROCESSING_STAFF", name: "Chế biến", branch_types: kitchen },
  { code: "SALES", name: "Bán hàng", branch_types: both },
  { code: "WAREHOUSE", name: "Kho", branch_types: both },
];

export const oneRole = [{ code: "SALES", name: "Bán hàng", branch_types: both }];
export const twoRoles = [{ code: "SALES", name: "Bán hàng", branch_types: both }, { code: "WAREHOUSE", name: "Kho", branch_types: both }];
export const thirtyRoles = Array.from({ length: 30 }, (_, index) => ({ code: `MAU_${index + 1}`, name: `Vai trò mẫu ${index + 1}`, branch_types: both }));

export const roleEnvelope = (items: readonly unknown[]) => ({ code: 200, status: "success", message: "OK", data: { items } });
