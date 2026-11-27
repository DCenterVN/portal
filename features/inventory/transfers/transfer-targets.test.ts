import { expect, it } from "vitest";
import { transferTargets } from "./transfer-targets";

const branches = [{ id: "a", name: "Cầu Giấy", kind: "Cửa hàng" }, { id: "b", name: "Bếp trung tâm Hà Nội", kind: "Bếp trung tâm" }];

it("transfer_targets_without_own: bỏ chi nhánh của phiên, giữ mọi chi nhánh còn lại", () => {
  expect(transferTargets(branches, "a").map(branch => branch.id)).toEqual(["b"]);
  expect(transferTargets(branches, "").map(branch => branch.id)).toEqual(["a", "b"]);
  expect(transferTargets(undefined, "a")).toEqual([]);
});
