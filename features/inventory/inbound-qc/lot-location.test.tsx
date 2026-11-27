import { expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import type { StorageLocation } from "@/lib/api/storage-locations";
import { ZoneBadge } from "../storage-locations/zone-badge";
import { LotLocation } from "./lot-location";

const catalog: Record<string, StorageLocation> = { "KHO-LANH-1": { id: "a", code: "KHO-LANH-1", name: "Kho lạnh 1", zone: "COLD", active: true } };
const out = (code: string) => renderToStaticMarkup(<LotLocation code={code} catalog={catalog} />);

it("vị trí: có trong danh mục hiện mã kèm tên; mã cũ hiện nhạt; chưa gán hiện Chưa gán", () => {
  expect(out("KHO-LANH-1")).toMatch(/KHO-LANH-1.*Kho lạnh 1/);
  const legacy = out("COLD-01");
  expect(legacy).toContain("COLD-01");
  expect(legacy).toContain("text-muted-foreground");
  expect(out("")).toContain("Chưa gán");
});

it("nhãn khu đúng màu theo khu", () => {
  const badge = (zone: string) => renderToStaticMarkup(<ZoneBadge zone={zone} />);
  expect(badge("COLD")).toMatch(/bg-blue-100[^>]*>Lạnh/);
  expect(badge("CHILL")).toMatch(/bg-teal-100[^>]*>Mát/);
  expect(badge("DRY")).toMatch(/bg-amber-100[^>]*>Khô/);
});
