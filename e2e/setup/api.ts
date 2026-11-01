import { readFileSync } from "node:fs";
import { homedir } from "node:os";
import type { BrowserContext, APIRequestContext } from "@playwright/test";
import { z } from "zod";

export function sessionApi(context: BrowserContext) {
  async function fetch(path: string, options: Parameters<APIRequestContext["fetch"]>[1] = {}) {
    const cookies = await context.cookies();
    return context.request.fetch(path, { ...options, headers: { ...options.headers, cookie: cookies.map(({ name, value }) => `${name}=${value}`).join("; ") } });
  }
  return {
    fetch,
    get: (path: string, options?: Parameters<APIRequestContext["get"]>[1]) => fetch(path, { ...options, method: "GET" }),
    post: (path: string, options?: Parameters<APIRequestContext["post"]>[1]) => fetch(path, { ...options, method: "POST" }),
    put: (path: string, options?: Parameters<APIRequestContext["put"]>[1]) => fetch(path, { ...options, method: "PUT" }),
    patch: (path: string, options?: Parameters<APIRequestContext["patch"]>[1]) => fetch(path, { ...options, method: "PATCH" }),
  };
}
export type SessionApi = ReturnType<typeof sessionApi>;

export const manifestPath = process.env.SUPPLIER_CONTRACT_CONTEXT ?? `${homedir()}/work/ticket/.cache/e2e/s7-data.json`;
const entity = z.object({ id: z.string().uuid(), name: z.string() });
export const manifestSchema = z.object({
  suffix: z.string(), names: z.record(z.string()), ids: z.record(z.string()),
  fixture: z.object({ supplier_id: z.string().uuid(), supplier_name: z.string(), material_name: z.string(), valid_from: z.string(), valid_to: z.string(), unit_price_vnd: z.number(), uom: z.string(), lines: z.array(z.object({ name: z.string(), sku_ref: z.string().uuid(), unit_price_vnd: z.number(), uom: z.string() })).default([]) }),
  materials: z.record(entity.extend({ sku_code: z.string(), uom_code: z.string(), selectable: z.boolean() })),
});
export function readManifest() { return manifestSchema.parse(JSON.parse(readFileSync(manifestPath, "utf8"))); }
