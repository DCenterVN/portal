import { expect, it, vi } from "vitest";
import { FetchError } from "@/lib/fetcher";
import type { StorageLocation } from "@/lib/api/storage-locations";
import { duplicateCodeMessage, locationFormSchema, submitFailure } from "../storage-locations/storage-location-form";
import { addAndPick, locationOptions } from "./location-field";

const loc = (code: string, zone = "COLD"): StorageLocation => ({ id: crypto.randomUUID(), code, name: `Tên ${code}`, zone, active: true });

it("danh sách chọn chỉ có vị trí đang bật; mã cũ ngoài danh mục được thêm lên đầu", () => {
  const active = [loc("KHO-LANH-1"), loc("KHO-MAT-1", "CHILL")];
  expect(locationOptions(active, "").map(item => item.code)).toEqual(["KHO-LANH-1", "KHO-MAT-1"]);
  expect(locationOptions(active, "KHO-MAT-1")).toHaveLength(2);
  expect(locationOptions(active, " KHO-LANH-01 ").map(item => item.code)).toEqual(["KHO-LANH-01", "KHO-LANH-1", "KHO-MAT-1"]);
});

it("tạo xong thì làm mới danh sách rồi tự chọn đúng mã vừa tạo", async () => {
  const order: string[] = [];
  const create = vi.fn().mockImplementation(async () => { order.push("create"); return loc("KHO-KHO-1", "DRY"); });
  await addAndPick({ code: "KHO-KHO-1", name: "Kho khô 1", zone: "DRY" }, { create, refresh: async () => { order.push("refresh"); }, pick: code => order.push(`pick:${code}`) });
  expect(order).toEqual(["create", "refresh", "pick:KHO-KHO-1"]);
});

it("form vị trí: mã đúng dạng, tên bắt buộc, khu thuộc ba khu; 409 báo ngay dưới ô mã", () => {
  expect(locationFormSchema.safeParse({ code: "KHO-1", name: "Kho", zone: "DRY" }).success).toBe(true);
  expect(locationFormSchema.safeParse({ code: "kho 1", name: "Kho", zone: "DRY" }).success).toBe(false);
  expect(locationFormSchema.safeParse({ code: "KHO-1", name: " ", zone: "DRY" }).success).toBe(false);
  expect(locationFormSchema.safeParse({ code: "KHO-1", name: "Kho", zone: "HOT" }).success).toBe(false);
  expect(locationFormSchema.safeParse({ code: "A".repeat(33), name: "Kho", zone: "COLD" }).success).toBe(false);
  expect(submitFailure(new FetchError("trùng", 409))).toEqual({ field: true, message: duplicateCodeMessage });
  expect(submitFailure(new FetchError("Vị trí kho X không có trong danh mục", 400))).toEqual({ field: false, message: "Vị trí kho X không có trong danh mục" });
});
