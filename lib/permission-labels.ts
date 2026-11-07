export const AREAS = [
  { prefix: "inventory", name: "Kho" },
  { prefix: "production", name: "Sản xuất" },
  { prefix: "sales", name: "Bán hàng" },
  { prefix: "customer", name: "Khách hàng" },
  { prefix: "org", name: "Tổ chức" },
  { prefix: "auth", name: "Tài khoản" },
] as const;

export const ROLE_INFO: Record<string, { name: string; job: string }> = {
  ADMIN: { name: "Quản trị hệ thống", job: "Toàn quyền: quản lý nhân viên, vai trò, duyệt giá và chỉ tiêu sản xuất" },
  FOOD_DEV: { name: "Dinh dưỡng", job: "Soạn món, gói, công thức, thực đơn và lập chỉ tiêu sản xuất" },
  WAREHOUSE: { name: "Kho", job: "Nhận hàng, kiểm định đầu vào, xếp kệ, kiểm tồn" },
  PROCESSING_STAFF: { name: "Chế biến", job: "Làm lệnh sản xuất và kiểm định thành phẩm" },
  SALES: { name: "Bán hàng", job: "Tạo sản phẩm, gói bán, bảng giá, mở bán và xử lý đơn" },
  CUSTOMER: { name: "Khách hàng", job: "Xem sản phẩm, giỏ hàng, đặt và huỷ đơn của chính mình" },
};

export const PERMISSION_LABELS: Record<string, string> = {
  "auth:self:delete": "Xoá tài khoản của mình",
  "auth:self:read": "Xem tài khoản của mình",
  "auth:self:update": "Sửa tài khoản của mình",
  "auth:user:update": "Quản lý tài khoản người dùng",
  "customer:customer:read": "Xem khách hàng",
  "customer:customer:update": "Sửa thông tin khách hàng",
  "customer:customer_pii:read": "Xem số điện thoại và email khách",
  "inventory:goods_receipt:create": "Tạo phiếu nhập hàng",
  "inventory:goods_receipt:update": "Sửa phiếu nhập hàng",
  "inventory:lot:read": "Xem lô hàng",
  "inventory:lot:update": "Sửa lô hàng",
  "inventory:lot_allergen:update": "Cập nhật chất gây dị ứng của lô",
  "inventory:lot_qc_decision:create": "Quyết định kiểm định lô hàng",
  "inventory:qc:update": "Kiểm định hàng nhập",
  "inventory:shelf_placement:create": "Xếp hàng lên kệ",
  "inventory:shelf_placement:read": "Xem kệ hàng",
  "inventory:stock:read": "Xem tồn kho",
  "inventory:supplier:create": "Thêm nhà cung cấp",
  "inventory:supplier:read": "Xem nhà cung cấp",
  "inventory:supplier:update": "Sửa nhà cung cấp",
  "inventory:transfer:create": "Tạo phiếu chuyển hàng",
  "inventory:transfer:read": "Xem phiếu chuyển hàng",
  "inventory:transfer_receipt:create": "Nhận hàng chuyển đến",
  "org:branch:create": "Tạo chi nhánh",
  "org:branch:read": "Xem chi nhánh",
  "org:branch:update": "Sửa chi nhánh",
  "org:company:read": "Xem thông tin công ty",
  "org:employee:create": "Thêm nhân viên",
  "org:membership:read": "Xem danh sách nhân viên",
  "org:membership:update": "Đổi vai trò, khoá nhân viên",
  "org:role:read": "Xem danh mục vai trò",
  "org:role:update": "Sửa quyền của vai trò",
  "production:fefo_override:create": "Cấp phát ngoại lệ theo hạn dùng",
  "production:food_plan:create": "Tạo thực đơn",
  "production:food_plan:read": "Xem thực đơn",
  "production:food_plan:update": "Sửa thực đơn",
  "production:material_requirement:read": "Xem nhu cầu nguyên liệu",
  "production:order:read": "Xem lệnh sản xuất",
  "production:order:update": "Làm lệnh sản xuất",
  "production:qc:update": "Kiểm định thành phẩm",
  "production:recipe:create": "Tạo công thức",
  "production:recipe:delete": "Xoá công thức",
  "production:recipe:read": "Xem công thức",
  "production:recipe:update": "Sửa công thức",
  "production:target:create": "Tạo chỉ tiêu sản xuất",
  "production:target:read": "Xem chỉ tiêu sản xuất",
  "production:target_approval:create": "Duyệt chỉ tiêu sản xuất",
  "sales:cart:create": "Thêm vào giỏ hàng",
  "sales:cart:delete": "Xoá khỏi giỏ hàng",
  "sales:cart:read": "Xem giỏ hàng",
  "sales:cart:update": "Sửa giỏ hàng",
  "sales:catalog:read": "Xem danh mục sản phẩm",
  "sales:order:create": "Đặt hàng",
  "sales:order:read": "Xem đơn hàng",
  "sales:order:update": "Xử lý đơn hàng",
  "sales:order_cancellation:create": "Huỷ đơn hàng",
  "sales:payment:update": "Cập nhật thanh toán",
  "sales:price_book:create": "Tạo bảng giá",
  "sales:price_book_approval:create": "Duyệt bảng giá",
  "sales:price_floor:read": "Xem giá sàn",
  "sales:price_floor_policy:create": "Tạo chính sách giá sàn",
  "sales:price_floor_policy:read": "Xem chính sách giá sàn",
  "sales:price_floor_policy:update": "Sửa chính sách giá sàn",
  "sales:price_floor_policy_approval:create": "Duyệt chính sách giá sàn",
  "sales:product:create": "Tạo sản phẩm",
  "sales:product:delete": "Xoá sản phẩm",
  "sales:product:read": "Xem sản phẩm",
  "sales:product:update": "Sửa sản phẩm",
  "sales:product_listing:update": "Mở bán, dừng bán sản phẩm",
  "sales:variant:create": "Tạo gói bán (SKU)",
  "sales:variant:delete": "Xoá gói bán (SKU)",
  "sales:variant:read": "Xem gói bán (SKU)",
  "sales:variant:update": "Sửa gói bán (SKU)",
};

export type PermissionItem = { key: string; label: string; granted: boolean };
export type PermissionGroup = { area: string; items: PermissionItem[]; granted: number; total: number; state: boolean | "indeterminate" };

export function permissionLabel(key: string): string {
  return PERMISSION_LABELS[key] ?? key;
}

export function missingLabels(keys: readonly string[]): string[] {
  return keys.filter((key) => !(key in PERMISSION_LABELS));
}

export function roleName(code: string): string {
  return ROLE_INFO[code.trim().toUpperCase()]?.name ?? code;
}

export function plain(text: string): string {
  return text.normalize("NFD").replace(/\p{M}/gu, "").replace(/đ/g, "d").toLowerCase();
}

export function groupPermissions(catalog: readonly string[], granted: readonly string[], query = ""): PermissionGroup[] {
  const have = new Set(granted);
  const needle = plain(query.trim());
  return AREAS.map(({ prefix, name }) => {
    const all = catalog.filter((key) => key.startsWith(`${prefix}:`)).sort().map((key) => ({ key, label: permissionLabel(key), granted: have.has(key) }));
    const items = needle ? all.filter((item) => plain(item.label).includes(needle)) : all;
    const count = all.filter((item) => item.granted).length;
    const state: PermissionGroup["state"] = count === 0 ? false : count === all.length ? true : "indeterminate";
    return { area: name, items, granted: count, total: all.length, state };
  }).filter((group) => group.items.length > 0);
}

export function toggleGroup(draft: readonly string[], keys: readonly string[], on: boolean): string[] {
  const rest = draft.filter((key) => !keys.includes(key));
  return on ? [...rest, ...keys] : rest;
}

const AUDIT_ACTIONS: Record<string, string> = {
  "role_matrix.replace": "Sửa quyền của vai trò",
  "branch.created": "Tạo chi nhánh",
  "branch.updated": "Sửa chi nhánh",
  "membership.created": "Thêm nhân viên",
  "membership.roles_replaced": "Đổi vai trò nhân viên",
  "membership.status_updated": "Khoá hoặc mở nhân viên",
  "membership.all_branches_updated": "Đổi quyền xem mọi chi nhánh",
};

export function auditActionLabel(action: string): string {
  return AUDIT_ACTIONS[action] ?? action;
}
