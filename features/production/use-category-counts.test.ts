import { beforeEach, describe, expect, it, vi } from "vitest";
import { listMaterials, type Material } from "@/lib/api/material-catalog";
import { loadCodeCounts } from "./use-category-counts";

vi.mock("@/lib/api/material-catalog", () => ({ listMaterials: vi.fn() }));

const material = (id: string, status: Material["status"]): Material => ({ id, name: id, category: "rau", group: "rau_la", imageUrl: null, status, unit: "KG" });

describe("đếm nguyên liệu mọi trạng thái", () => {
  beforeEach(() => vi.mocked(listMaterials).mockImplementation(async status => status === "DRAFT" ? [material("n1", "DRAFT")] : status === "SUSPENDED" ? [material("s1", "SUSPENDED")] : []));
  it("loại không có nguyên liệu đang dùng nhưng có nháp thì số đếm vẫn > 0", async () => {
    const counts = await loadCodeCounts([]);
    expect(counts.rau).toBe(2);
    expect(counts.rau_la).toBe(2);
  });
});
