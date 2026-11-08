import { z } from "zod";
import { decodePlatform, pageSchema } from "./platform-contract";
import { companyCall } from "./platform-client";

export const branchSchema = z.object({
  id: z.string().uuid(), code: z.string(), name: z.string(),
  type: z.string(),
  status: z.enum(["ACTIVE", "SUSPENDED", "CLOSED"]),
  employee_count: z.number(),
});
const companySchema = z.object({ id: z.string(), name: z.string() });
export type Branch = z.infer<typeof branchSchema> & { org?: string };
export type BranchStatus = Branch["status"];

const json = { "content-type": "application/json" };

export async function companyBranches(): Promise<Branch[]> {
  const [branches, company] = await Promise.all([
    companyCall<unknown>("company/branches?page=1&limit=100", ""),
    companyCall<unknown>("company", ""),
  ]);
  const page = decodePlatform(branches, pageSchema(branchSchema));
  const org = decodePlatform(company, companySchema).name;
  return page.items.map((branch) => ({ ...branch, org }));
}
export async function createBranch(input: { code: string; name: string; type?: "CENTRAL_KITCHEN" | "STORE" }): Promise<Branch> {
  return decodePlatform(await companyCall<unknown>("company/branches", "", { method: "POST", headers: json, body: JSON.stringify(input) }), branchSchema);
}
export async function updateBranchStatus(id: string, status: BranchStatus): Promise<Branch> {
  return decodePlatform(await companyCall<unknown>(`company/branches/${encodeURIComponent(id)}`, "", { method: "PATCH", headers: json, body: JSON.stringify({ status }) }), branchSchema);
}
