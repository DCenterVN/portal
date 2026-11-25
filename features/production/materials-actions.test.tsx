import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { AccessProvider } from "@/lib/access-boundary";
import { createMaterial, deleteMaterial, suspendMaterial, uploadMaterialImage, createCategory, viMessage } from "@/lib/api/material-catalog-write";
import { FetchError } from "@/lib/fetcher";
import { listMaterials } from "@/lib/api/material-catalog";
import { MaterialsView } from "./materials-view";
import { MaterialGrid } from "./materials-view-parts";
import { readFileSync } from "node:fs";
import { MaterialActions, NameField, UnitField, materialPatch, actionsFor, canDeleteMaterial, isDeletedMissing, unitOf, groupChoice, locksFor } from "./material-item-sheet";
import { suggestCode, UNCATEGORIZED, filterMaterials, countByCategory } from "./materials-catalog";
import { CategoryBar } from "./materials-view-parts";
import { TREE } from "./materials-fixtures";

vi.mock("next/navigation", () => ({ useRouter: () => ({ replace: () => {} }), usePathname: () => "/production/materials", useSearchParams: () => new URLSearchParams("") }));

const ROLES = {
  admin: ["sales:product:read", "sales:material:create", "sales:material:update", "sales:material:lifecycle", "inventory:material_category:read", "inventory:material_category:create", "inventory:material_category:update", "inventory:material_category:lifecycle"],
  food_dev: ["sales:product:read", "sales:material:create", "sales:material:update", "sales:material:lifecycle", "inventory:material_category:read", "inventory:material_category:create", "inventory:material_category:update", "inventory:material_category:lifecycle"],
  warehouse: ["sales:product:read", "sales:material:create", "inventory:material_category:read"],
  sales: ["sales:product:read", "inventory:material_category:read"],
};
const as = (role: keyof typeof ROLES) => renderToStaticMarkup(<AccessProvider value={{ plane: "company", root: "/employee", actions: new Set(ROLES[role]) }}><MaterialsView /></AccessProvider>);

describe("nút theo vai", () => {
  it("Bán hàng không thấy Thêm nguyên liệu, Đề xuất nguyên liệu, Quản lý loại", () => {
    const html = as("sales");
    for (const text of ["Thêm nguyên liệu", "Đề xuất nguyên liệu", "Quản lý loại"]) expect(html).not.toContain(text);
  });
  it("Kho thấy Đề xuất nguyên liệu, không thấy Thêm nguyên liệu hay Quản lý loại", () => {
    const html = as("warehouse");
    expect(html).toContain("Đề xuất nguyên liệu");
    expect(html).not.toContain("Thêm nguyên liệu");
    expect(html).not.toContain("Quản lý loại");
  });
  it("Bếp và Quản trị thấy Thêm nguyên liệu và Quản lý loại", () => {
    for (const role of ["food_dev", "admin"] as const) {
      const html = as(role);
      expect(html).toContain("Thêm nguyên liệu");
      expect(html).toContain("Quản lý loại");
      expect(html).not.toContain("Đề xuất nguyên liệu");
    }
  });
});

describe("nút trong khung sửa", () => {
  const can = (role: keyof typeof ROLES) => (action: string) => ROLES[role].includes(action);
  const material = (status: "ACTIVE" | "DRAFT" | "SUSPENDED") => ({ id: "1", name: "A", category: "rau", group: "rau_la", imageUrl: null, status, unit: "KG" as const });
  it("Bếp: đang dùng có Lưu và Ngừng dùng…, nháp thêm Duyệt, đã ngừng chỉ Dùng lại", () => {
    expect(actionsFor(material("ACTIVE"), can("food_dev"))).toEqual(["Lưu", "Ngừng dùng…"]);
    expect(actionsFor(material("DRAFT"), can("food_dev"))).toEqual(["Lưu", "Duyệt", "Ngừng dùng…"]);
    expect(actionsFor(material("SUSPENDED"), can("food_dev"))).toEqual(["Dùng lại"]);
  });
  it("Kho và Bán hàng không có nút nào", () => {
    expect(actionsFor(material("DRAFT"), can("warehouse"))).toEqual([]);
    expect(actionsFor(material("ACTIVE"), can("sales"))).toEqual([]);
  });
  it("khung hiện đúng chữ trên nút", () => {
    const html = renderToStaticMarkup(<MaterialActions labels={["Lưu", "Duyệt", "Ngừng dùng…"]} busy={false} onAction={() => {}} />);
    for (const text of ["Lưu", "Duyệt", "Ngừng dùng…"]) expect(html).toContain(text);
  });
});

type Call = { url: string; method: string; headers: Record<string, string>; body: unknown };
const calls: Call[] = [];
const reply = vi.fn<(call: Call) => { status: number; body?: unknown }>();
beforeEach(() => {
  calls.length = 0;
  reply.mockReset();
  reply.mockReturnValue({ status: 200, body: { data: { id: "new1" } } });
  vi.stubGlobal("fetch", vi.fn(async (url: string | URL, init: RequestInit = {}) => {
    const body = typeof init.body === "string" ? JSON.parse(init.body) : init.body;
    const call = { url: String(url), method: init.method ?? "GET", headers: (init.headers ?? {}) as Record<string, string>, body };
    calls.push(call);
    const out = reply(call);
    return new Response(out.status === 204 ? null : JSON.stringify(out.body ?? {}), { status: out.status });
  }));
});
afterEach(() => vi.unstubAllGlobals());
const path = (call: Call) => new URL(call.url, "http://x").pathname;

describe("thêm món", () => {
  it("gửi đúng thân, đúng đường và có Idempotency-Key", async () => {
    await createMaterial({ name: "Cà chua", uom_code: "KG", material_group_code: "RAU_LA" });
    expect(path(calls[0])).toBe("/api/sales/skus");
    expect(calls[0].method).toBe("POST");
    expect(calls[0].body).toEqual({ name: "Cà chua", uom_code: "KG", material_group_code: "RAU_LA" });
    expect(calls[0].headers["Idempotency-Key"]).toBeTruthy();
  });
  it("trùng tên thì hiện Đã có nguyên liệu tên này, không lộ mã lỗi", async () => {
    reply.mockReturnValue({ status: 409, body: { message: "duplicate", errors: { error_code: "duplicate_resource" } } });
    const error = await createMaterial({ name: "A", uom_code: "KG", material_group_code: "X" }).catch(e => e);
    expect(error).toBeInstanceOf(FetchError);
    expect(viMessage(error, "material")).toBe("Đã có nguyên liệu tên này");
  });
  it("lỗi 403 và 409 khi ngừng loại có câu tiếng Việt", () => {
    expect(viMessage(new FetchError("x", 403), "material")).toBe("Bạn không có quyền làm việc này");
    expect(viMessage(new FetchError("x", 409, { errors: { error_code: "state_conflict" } }), "category")).toBe("Loại còn nhóm đang dùng hoặc đang gắn nhà cung cấp");
    expect(viMessage(new FetchError("uuid 0192", 500), "material")).not.toMatch(/uuid|500/);
  });
});

describe("ngừng dùng", () => {
  it("không có lý do thì không gọi API", async () => {
    await expect(suspendMaterial("m1", "   ")).rejects.toThrow();
    expect(calls).toHaveLength(0);
  });
  it("có lý do thì gọi /suspend với reason", async () => {
    await suspendMaterial("m1", "Nhập nhầm");
    expect(path(calls[0])).toBe("/api/sales/skus/m1/suspend");
    expect(calls[0].body).toEqual({ reason: "Nhập nhầm" });
  });
});

describe("ảnh", () => {
  it("đủ 3 bước đúng thứ tự: xin link, tải lên MinIO với file cuối, finalize", async () => {
    reply.mockImplementation(call => {
      if (path(call).endsWith("/image-uploads")) return { status: 200, body: { data: { upload_id: "u1", upload_url: "http://minio.local/bucket", form_fields: { key: "k", policy: "p" } } } };
      if (call.url.startsWith("http://minio.local")) return { status: 204 };
      return { status: 200, body: { data: {} } };
    });
    await uploadMaterialImage("m1", new File([new Uint8Array([1, 2, 3])], "a.png", { type: "image/png" }));
    expect(calls.map(call => `${call.method} ${call.url.startsWith("http://minio") ? "minio" : path(call)}`)).toEqual([
      "POST /api/sales/skus/m1/image-uploads", "POST minio", "POST /api/sales/skus/m1/image-uploads/u1/finalize",
    ]);
    expect(calls[0].body).toMatchObject({ content_type: "image/png", file_size: 3 });
    expect((calls[0].body as { sha256: string }).sha256).toMatch(/^[0-9a-f]{64}$/);
    const keys = [...(calls[1].body as FormData).keys()];
    expect(keys[keys.length - 1]).toBe("file");
  });
});

describe("đọc món theo trạng thái", () => {
  it("status gửi lên API theo trạng thái, đi hết các trang, gắn loại theo cây", async () => {
    reply.mockImplementation(call => new URL(call.url, "http://x").searchParams.get("cursor")
      ? { status: 200, body: { data: { items: [{ id: "2", name: "Bò 2", material_group_code: "BO", status: "DRAFT", uom_code: "KG", image_url: null }], next_cursor: "" } } }
      : { status: 200, body: { data: { items: [{ id: "1", name: "Lợn 1", material_group_code: "LON", status: "DRAFT", uom_code: "KG", image_url: "http://i/1" }], next_cursor: "c1" } } });
    const items = await listMaterials("DRAFT", TREE);
    const first = new URL(calls[0].url, "http://x").searchParams;
    expect(first.get("status")).toBe("DRAFT");
    expect(first.get("kind")).toBe("RAW_MATERIAL");
    expect(calls).toHaveLength(2);
    expect(items).toEqual([
      { id: "1", name: "Lợn 1", category: "thit", group: "lon", imageUrl: "http://i/1", status: "DRAFT", unit: "KG" },
      { id: "2", name: "Bò 2", category: "thit", group: "bo", imageUrl: null, status: "DRAFT", unit: "KG" },
    ]);
  });
});

describe("quản lý loại", () => {
  it("mã gợi ý từ tên: bỏ dấu, viết hoa, dấu cách thành _", () => {
    expect(suggestCode("Thịt lợn")).toBe("THIT_LON");
    expect(suggestCode("  Đồ khô, hạt ")).toBe("DO_KHO_HAT");
  });
  it("thêm nhóm gửi parent_code, thêm loại thì không có", async () => {
    await createCategory({ code: "THIT_LON", name: "Thịt lợn", parent_code: "THIT" });
    expect(path(calls[0])).toBe("/api/inventory/material-categories");
    expect(calls[0].body).toEqual({ code: "THIT_LON", name: "Thịt lợn", parent_code: "THIT" });
    await createCategory({ code: "NAM", name: "Nấm" });
    expect(calls[1].body).toEqual({ code: "NAM", name: "Nấm" });
  });
});

describe("chữ nguyên liệu", () => {
  const quantity = new FetchError("name_has_quantity: tên nguyên liệu không được chứa khối lượng hay quy cách (như 1kg, 500ml, 300gr/khay)", 422, { errors: { error_code: "validation_failed" } });
  it("422 name_has_quantity hiện câu nhắc về khối lượng", () => {
    expect(viMessage(quantity, "material")).toBe('Tên nguyên liệu không ghi khối lượng hay quy cách, ví dụ bỏ "1kg", "500ml"');
    expect(viMessage(new FetchError("other", 422), "material")).toBe("Thông tin chưa hợp lệ, hãy kiểm tra lại");
  });
  it("ô tên có gợi ý và hiện lỗi dưới ô", () => {
    const html = renderToStaticMarkup(<NameField value="" onChange={() => {}} disabled={false} error="" />);
    expect(html.replaceAll("&quot;", '"')).toContain('Chỉ ghi tên chung, ví dụ "Ba chỉ lợn". Không ghi khối lượng.');
    expect(html).toContain("Tên nguyên liệu");
    const bad = renderToStaticMarkup(<NameField value="x" onChange={() => {}} disabled={false} error="Lỗi tên" />);
    expect(bad).toContain('aria-invalid="true"');
    expect(bad).toContain("Lỗi tên");
  });
  it("không còn chữ món trong màn Nguyên liệu và lớp dữ liệu", () => {
    const files = ["materials-view.tsx", "materials-view-parts.tsx", "material-item-sheet.tsx", "material-category-sheet.tsx", "material-group-filter.tsx", "../../lib/api/material-catalog-write.ts"];
    for (const file of files) expect(readFileSync(new URL(file, import.meta.url), "utf8")).not.toMatch(/(^|[^\p{L}])món([^\p{L}]|$)/iu);
    for (const role of ["admin", "warehouse"] as const) expect(as(role)).not.toMatch(/(^|[^\p{L}])món([^\p{L}]|$)/iu);
    expect(renderToStaticMarkup(<MaterialGrid items={[]} />)).not.toMatch(/món/i);
    expect(viMessage(new FetchError("x", 409, { errors: { error_code: "state_conflict" } }), "material")).not.toMatch(/món/i);
  });
});

describe("đơn vị chỉ sửa khi nháp", () => {
  const body = { name: "A", uom_code: "KG" as const, material_group_code: "X" };
  const material = (status: "ACTIVE" | "DRAFT" | "SUSPENDED") => ({ id: "1", name: "A", category: "thit", group: "y", imageUrl: null, status, unit: "KG" as const });
  it("Đang dùng và Đã ngừng thì ô Đơn vị khoá kèm gợi ý, thân PATCH không có uom_code", () => {
    for (const status of ["ACTIVE", "SUSPENDED"] as const) {
      expect(materialPatch(material(status), body)).toEqual({ name: "A", material_group_code: "X" });
      const html = renderToStaticMarkup(<UnitField locked value="KG" onChange={() => {}} error="" />);
      expect(html).toContain('disabled=""');
      expect(html).toContain("Chỉ đổi đơn vị khi nguyên liệu còn là nháp");
    }
  });
  it("Nháp thì ô Đơn vị sửa được và thân PATCH có uom_code", () => {
    expect(materialPatch(material("DRAFT"), body)).toEqual(body);
    const html = renderToStaticMarkup(<UnitField locked={false} value="KG" onChange={() => {}} error="" />);
    expect(html).not.toContain('disabled=""');
  });
  it("409 đơn vị gốc hiện câu về đơn vị, không hiện câu đổi trạng thái", () => {
    const error = new FetchError("đơn vị gốc chỉ sửa được khi nguyên liệu còn là nháp", 409, { errors: { error_code: "state_conflict" } });
    expect(viMessage(error, "material")).toBe("Chỉ đổi đơn vị khi nguyên liệu còn là nháp");
    expect(viMessage(new FetchError("x", 409, { errors: { error_code: "state_conflict" } }), "material")).toBe("Nguyên liệu đã đổi trạng thái, hãy tải lại danh sách");
  });
});

describe("lô 7: đơn vị lạ", () => {
  it("trang có dòng uom_code G vẫn đọc được và hiện", async () => {
    reply.mockReturnValue({ status: 200, body: { data: { items: [{ id: "1", name: "Muối", material_group_code: "LON", status: "DRAFT", uom_code: "G", image_url: null }], next_cursor: "" } } });
    const items = await listMaterials("DRAFT", TREE);
    expect(items).toHaveLength(1);
    expect(items[0].unit).toBe("G");
  });
  it("đơn vị ngoài KG/L/EA thì ô Đơn vị để trống, bắt chọn lại", () => {
    expect(unitOf("G")).toBe("");
    expect(unitOf("KG")).toBe("KG");
    const html = renderToStaticMarkup(<UnitField locked={false} value="" onChange={() => {}} error="" />);
    expect(html).toContain("Chọn đơn vị");
  });
  it("đơn vị trống thì chặn Lưu và Duyệt", () => {
    const html = renderToStaticMarkup(<MaterialActions labels={["Lưu", "Duyệt", "Ngừng dùng…"]} busy={false} blocked onAction={() => {}} />);
    expect(html.match(/disabled=""/g)).toHaveLength(2);
  });
});

describe("lô 7: trùng mã loại, nhóm", () => {
  const conflict = new FetchError("Mã đã tồn tại", 409, { errors: { error_code: "STATE_CONFLICT" } });
  it("thêm loại hoặc nhóm gặp 409 thì báo đã có mã này", () => {
    expect(viMessage(conflict, "new-category")).toBe("Đã có loại hoặc nhóm mã này");
  });
  it("ngừng dùng gặp 409 giữ câu cũ", () => {
    expect(viMessage(conflict, "category")).toBe("Loại còn nhóm đang dùng hoặc đang gắn nhà cung cấp");
  });
  it("sales báo duplicate_resource thì thêm nguyên liệu hiện Đã có nguyên liệu tên này", () => {
    const error = new FetchError("material name already exists", 409, { errors: { error_code: "duplicate_resource" } });
    error.code = "duplicate_resource";
    expect(viMessage(error, "material")).toBe("Đã có nguyên liệu tên này");
  });
});

describe("lô 7: các trường hợp riêng", () => {
  const can = (action: string) => ROLES.food_dev.includes(action);
  const material = (status: "ACTIVE" | "DRAFT" | "SUSPENDED") => ({ id: "1", name: "A", category: "thit", group: "lon", imageUrl: null, status, unit: "KG" });
  it("Đã ngừng: tên, loại, nhóm chỉ đọc, không đổi hay xoá ảnh", () => {
    expect(locksFor(material("SUSPENDED"), can)).toEqual({ fields: false, image: false });
    expect(locksFor(material("ACTIVE"), can)).toEqual({ fields: true, image: true });
    expect(locksFor("new", can)).toEqual({ fields: true, image: true });
  });
  it("nhóm đã ngừng: giữ nhóm cũ kèm (đã ngừng), không nhảy sang nhóm đầu", () => {
    const tree = [{ code: "thit", label: "Thịt", active: true, groups: [{ code: "lon", label: "Lợn", active: true }, { code: "bo", label: "Bò", active: false }] }];
    const choice = groupChoice(tree, "thit", "bo");
    expect(choice.value).toBe("bo");
    expect(choice.options).toEqual([{ code: "lon", label: "Lợn" }, { code: "bo", label: "Bò (đã ngừng)" }]);
  });
  it("nhóm chưa có: ô nhóm trống, không tự chọn nhóm đầu", () => {
    expect(groupChoice(TREE, "thit", "").value).toBe("");
  });
  it("chỉ gửi material_group_code khi người dùng đổi nhóm", () => {
    const body = { name: "A", uom_code: "KG" as const, material_group_code: "BO" };
    expect(materialPatch(material("DRAFT"), body)).toEqual({ name: "A", uom_code: "KG", material_group_code: "BO" });
    expect(materialPatch(material("DRAFT"), { ...body, material_group_code: "LON" })).toEqual({ name: "A", uom_code: "KG" });
  });
  const none = { id: "9", name: "Lạ", category: "", group: "", imageUrl: null, status: "ACTIVE" as const, unit: "KG" };
  it("nguyên liệu chưa có nhóm vẫn lọc được và đếm được", () => {
    expect(countByCategory([none])[UNCATEGORIZED]).toBe(1);
    expect(filterMaterials([none], UNCATEGORIZED, "")).toHaveLength(1);
    expect(filterMaterials([none], "thit", "")).toHaveLength(0);
  });
  it("thanh loại có nút Chưa xếp loại chỉ khi có dòng như vậy", () => {
    const bar = (counts: Record<string, number>) => renderToStaticMarkup(<CategoryBar current="thit" category={TREE} counts={counts} onSelect={() => {}} />);
    expect(bar({ [UNCATEGORIZED]: 2 })).toContain("Chưa xếp loại");
    expect(bar({})).not.toContain("Chưa xếp loại");
  });
});

describe("xoá nguyên liệu", () => {
  const can = (role: keyof typeof ROLES) => (action: string) => ROLES[role].includes(action);
  const material = (status: "ACTIVE" | "DRAFT" | "SUSPENDED") => ({ id: "1", name: "A", category: "thit", group: "lon", imageUrl: null, status, unit: "KG" as const });
  it("deleteMaterial gửi DELETE tới đúng đường và có Idempotency-Key", async () => {
    reply.mockReturnValue({ status: 200, body: { data: {} } });
    await deleteMaterial("m 1");
    expect(path(calls[0])).toBe("/api/sales/skus/m%201");
    expect(calls[0].method).toBe("DELETE");
    expect(calls[0].body).toBeUndefined();
    expect(calls[0].headers["Idempotency-Key"]).toBeTruthy();
  });
  it("nút Xoá nguyên liệu chỉ có khi nháp hoặc đã ngừng và có quyền vòng đời", () => {
    expect(canDeleteMaterial(material("DRAFT"), can("food_dev"))).toBe(true);
    expect(canDeleteMaterial(material("SUSPENDED"), can("food_dev"))).toBe(true);
    expect(canDeleteMaterial(material("ACTIVE"), can("food_dev"))).toBe(false);
    expect(canDeleteMaterial(material("DRAFT"), can("warehouse"))).toBe(false);
  });
  it("409 khi xoá phân loại theo error_code và coi 404 khi xoá là đã xoá", () => {
    const active = new FetchError("sku must not be active", 409, { errors: { error_code: "state_conflict" } });
    const inUse = new FetchError("x", 409, { errors: { error_code: "resource_in_use" } });
    expect(viMessage(active, "delete-material")).toBe("Cần ngừng dùng nguyên liệu trước khi xoá");
    expect(viMessage(inUse, "delete-material")).toBe("Chưa xoá được: nguyên liệu đang được dùng trong công thức hoặc bảng giá");
    expect(viMessage(new FetchError("x", 409, { errors: { error_code: "state_conflict" } }), "delete-material")).not.toMatch(/món/i);
    expect(isDeletedMissing("delete-material", new FetchError("missing", 404))).toBe(true);
    expect(isDeletedMissing("material", new FetchError("missing", 404))).toBe(false);
  });
});
