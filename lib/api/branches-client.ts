import { z } from "zod";
import { decodePlatform, pageSchema } from "./platform-contract";
import { companyCall } from "./platform-client";

export const branchSchema = z.object({
  id: z.string().uuid(), code: z.string(), name: z.string(),
  type: z.enum(["CENTRAL_KITCHEN", "STORE"]),
  status: z.enum(["ACTIVE", "SUSPENDED", "CLOSED"]),
  employee_count: z.number(),
});
export type Branch = z.infer<typeof branchSchema> & { org?: string };
export type BranchStatus = Branch["status"];

const json = { "content-type": "application/json" };

export async function companyBranches(): Promise<Branch[]> {
  const page = decodePlatform(await companyCall<unknown>("company/branches?page=1&limit=100", ""), pageSchema(branchSchema));
  const org = page.items.find((branch) => branch.type === "CENTRAL_KITCHEN")?.name;
  return page.items.map((branch) => ({ ...branch, org }));
}
export async function createBranch(input: { code: string; name: string }): Promise<Branch> {
  return decodePlatform(await companyCall<unknown>("company/branches", "", { method: "POST", headers: json, body: JSON.stringify(input) }), branchSchema);
}
export async function updateBranchStatus(id: string, status: BranchStatus): Promise<Branch> {
  return decodePlatform(await companyCall<unknown>(`company/branches/${encodeURIComponent(id)}`, "", { method: "PATCH", headers: json, body: JSON.stringify({ status }) }), branchSchema);
}
