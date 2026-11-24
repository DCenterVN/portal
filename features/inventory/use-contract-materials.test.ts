import { readdirSync, readFileSync } from "node:fs";
import { beforeEach, expect, it, vi } from "vitest";

const swr = vi.hoisted(() => ({ calls: [] as Array<{ key: unknown; fetcher: unknown }> }));
vi.mock("swr", () => ({ default: (key: unknown, fetcher: unknown) => { swr.calls.push({ key, fetcher }); return { data: undefined, error: undefined, mutate: vi.fn() }; } }));
vi.mock("@/lib/api/sales", async original => ({ ...await original<typeof import("@/lib/api/sales")>(), getMaterials: vi.fn() }));
import { getMaterials } from "@/lib/api/sales";

beforeEach(() => { swr.calls = []; vi.mocked(getMaterials).mockReset(); vi.resetModules(); });

it("dùng khoá SWR chung với kiểm đầu vào và tắt khi không được phép", async () => {
  const { useContractMaterials, CONTRACT_MATERIALS_KEY } = await import("./use-contract-materials");
  useContractMaterials(true); useContractMaterials(false);
  expect(CONTRACT_MATERIALS_KEY).toBe("inbound-qc-materials");
  expect(swr.calls.map(call => call.key)).toEqual(["inbound-qc-materials", null]);
});

it("tải danh mục nguyên liệu trang 100 dòng và chỉ một lần cho cả phiên", async () => {
  const { loadContractMaterials } = await import("./use-contract-materials");
  const { getMaterials: mocked } = await import("@/lib/api/sales");
  vi.mocked(mocked).mockResolvedValue({ items: [], categories: [], next_cursor: "", season_message: "" });
  await Promise.all([loadContractMaterials(), loadContractMaterials()]);
  await loadContractMaterials();
  expect(mocked).toHaveBeenCalledTimes(1);
  expect(String(vi.mocked(mocked).mock.calls[0][0])).toContain("limit=100");
});

it("lỗi thì lần sau tải lại được", async () => {
  const { loadContractMaterials } = await import("./use-contract-materials");
  const { getMaterials: mocked } = await import("@/lib/api/sales");
  vi.mocked(mocked).mockRejectedValueOnce(new Error("x")).mockResolvedValue({ items: [], categories: [], next_cursor: "", season_message: "" });
  await expect(loadContractMaterials()).rejects.toThrow();
  await expect(loadContractMaterials()).resolves.toEqual([]);
});

it("không còn chỗ nào trong features/inventory gọi thẳng getContractMaterials", () => {
  const walk = (dir: string): string[] => readdirSync(dir, { withFileTypes: true }).flatMap(entry => entry.isDirectory() ? walk(`${dir}/${entry.name}`) : [`${dir}/${entry.name}`]);
  const offenders = walk(__dirname).filter(file => /\.tsx?$/.test(file) && !/\.test\.tsx?$/.test(file) && !file.endsWith("use-contract-materials.ts")).filter(file => readFileSync(file, "utf8").includes("getContractMaterials"));
  expect(offenders).toEqual([]);
});

it("xếp danh mục theo tên tiếng Việt ngay sau khi tải", async () => {
  const { loadContractMaterials } = await import("./use-contract-materials");
  const { getMaterials: mocked } = await import("@/lib/api/sales");
  const item = (name: string) => ({ id: name, name }) as never;
  vi.mocked(mocked).mockResolvedValue({ items: [item("Thịt bò"), item("Cà chua"), item("Bắp cải"), item("Ớt")], categories: [], next_cursor: "", season_message: "" });
  expect((await loadContractMaterials()).map(material => material.name)).toEqual(["Bắp cải", "Cà chua", "Ớt", "Thịt bò"]);
});
