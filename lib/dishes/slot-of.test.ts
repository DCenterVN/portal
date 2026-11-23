import { describe, expect, it } from "vitest";
import { slotOf } from "./types";

const roots = ["THIT", "CA_LOAI", "THUY_HAI_SAN", "TRUNG_SUA", "DO_CHE_BIEN", "RAU_CU", "CU_QUA", "NAM", "TRAI_CAY", "GAO_NGU_COC", "DO_KHO", "GIA_VI", "COT_NUOC_DUNG"];
const tree = [...roots.map(code => ({ code, parent_code: null })), { code: "CA", parent_code: "CA_LOAI" }, { code: "QUA", parent_code: "CU_QUA" }, { code: "BUN_PHO_MI", parent_code: "GAO_NGU_COC" }];

describe("slotOf 13 loại", () => {
  it.each([
    ["THIT", "DAM"], ["CA_LOAI", "DAM"], ["THUY_HAI_SAN", "DAM"], ["TRUNG_SUA", "DAM"], ["DO_CHE_BIEN", "DAM"],
    ["GAO_NGU_COC", "TINH_BOT"],
    ["RAU_CU", "RAU"], ["CU_QUA", "RAU"], ["NAM", "RAU"], ["TRAI_CAY", "RAU"], ["DO_KHO", "RAU"],
    ["CA", "DAM"], ["BUN_PHO_MI", "TINH_BOT"], ["QUA", "RAU"],
  ])("%s -> %s", (code, slot) => expect(slotOf(code, tree)).toBe(slot));
});
