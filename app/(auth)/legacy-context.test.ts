import {afterEach, expect, it, vi} from "vitest";
vi.mock("next/navigation", () => ({redirect: vi.fn()}));
import {redirect} from "next/navigation";
import SwitchBranch from "./switch-branch/page";
import SwitchOrg from "./switch-org/page";
afterEach(() => vi.clearAllMocks());
it.each([[SwitchBranch,"/staff/switch-branch"],[SwitchOrg,"/staff/switch-org"]] as const)("R3 legacy page redirects into staff journey", (page, target) => {
 page();expect(redirect).toHaveBeenCalledWith(target);expect(redirect).toHaveBeenCalledTimes(1);
});
