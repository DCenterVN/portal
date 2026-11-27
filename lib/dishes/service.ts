import { NextRequest } from "next/server";
import { forwardService, serviceUrl } from "@/lib/api/service-bff";
import type { CompleteDeps } from "./complete-dish";
import type { DetailDeps, Product, SetDetail } from "./dish-detail";
import type { CostPreview, DishContent, DraftRow, GroupNode, Line } from "./types";
import { draftSchema } from "@/lib/api/dishes";
import { allPages } from "@/lib/api/all-pages";

type Service = "sales" | "production" | "inventory";
export function dishServices(request: NextRequest) {
  const baseUrls = {
    sales: serviceUrl("sales"),
    production: serviceUrl("production"),
    inventory: serviceUrl("inventory"),
  };
  async function call<T>(service: Service, path: string, method: "GET" | "POST" | "PUT" | "PATCH" = "GET", body?: unknown, key?: string): Promise<T> {
    const headers = new Headers(request.headers);
    headers.delete("idempotency-key");
    if (key) headers.set("Idempotency-Key", key);
    if (body !== undefined) headers.set("Content-Type", "application/json");
    const forwarded = new NextRequest(request.url, { method, headers, signal: request.signal, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
    const res = await forwardService(forwarded, { baseUrl: baseUrls[service], path, method, bodyPolicy: body === undefined ? "none" : "required", unavailableMessage: "Dịch vụ món hiện không khả dụng" });
    if (res.status === 204) return undefined as T;
    const data = await res.json();
    if (!res.ok) throw Object.assign(new Error(typeof data.message === "string" ? data.message : "Không xử lý được món"), { status: res.status, code: data.errors?.error_code ?? data.error, ...(data.errors?.fields ? { fields: data.errors.fields } : {}) });
    return (data.data ?? data) as T;
  }
  async function listDrafts(query: { product_ref: string; status: "OPEN" | "COMPLETED"; kind?: string }) {
    return allPages<DraftRow>(cursor => call("sales", `/sales/dish-drafts?${new URLSearchParams({ ...query, limit: "50", cursor })}`));
  }
  const getSet = (id: string) => call<SetDetail>("sales", `/sales/sets/${id}`);
  const activeRecipe = async (id: string) => (await call<{ current: { components: Line[] } | null }>("production", `/production/packages/${id}/recipes`)).current;
  const products = new Map<string, Promise<{ product: Product; variants: { id: string; sku_kind: string }[] }>>();
  const product = (id: string) => {
    const hit = products.get(id);
    if (hit) return hit;
    const req = call<{ product: Product; variants: { id: string; sku_kind: string }[] }>("sales", `/sales/products/${id}`);
    products.set(id, req);
    return req;
  };
  const detail: DetailDeps = {
    getProduct: async id => (await product(id)).product,
    listVariants: async id => Promise.all((await product(id)).variants.filter(item => item.sku_kind === "COMMERCIAL_SET").map(item => getSet(item.id))),
    getPackage: id => call("sales", `/sales/packages/${id}`), getActiveRecipe: activeRecipe, listDrafts,
  };
  async function context(content: DishContent) {
    const [groups, materials] = await Promise.all([
      call<{ items: { code: string; children: { code: string }[] }[] }>("inventory", "/inventory/material-categories"),
      allPages<{ id: string; material_group_code: string | null }>(cursor => call("sales", `/sales/skus?${new URLSearchParams({ kind: "RAW_MATERIAL", limit: "100", cursor })}`)),
    ]);
    const tree: GroupNode[] = groups.items.flatMap(group => [{ code: group.code, parent_code: null }, ...group.children.map(child => ({ code: child.code, parent_code: group.code }))]);
    const packages = [...new Set(content.seasonings.flatMap(line => line.package_ref ? [line.package_ref] : []))];
    const recipes = await Promise.all(packages.map(async id => ({ id, recipe: await activeRecipe(id) })));
    return { tree, skuGroups: Object.fromEntries(materials.map(item => [item.id, item.material_group_code])), packagesWithRecipe: recipes.filter(item => item.recipe).map(item => item.id) };
  }
  function complete(tree: GroupNode[], skuGroups: Record<string, string | null>, _content?: DishContent): CompleteDeps {
    return {
      tree, skuGroups, getActiveRecipe: activeRecipe, readSet: async id => { const set = await getSet(id); return { slots: set.slots, tags: set.tags, updated_at: set.updated_at }; },
      createProduct: async (input, key) => (await call<{ product: { id: string } }>("sales", "/sales/products", "POST", input, key)).product,
      updateProduct: async (id, input, key) => { await call("sales", `/sales/products/${id}`, "PATCH", input, key); },
      createPackage: (input, key) => call("sales", "/sales/packages", "POST", input, key),
      createRecipe: async (id, input, key) => { await call("production", `/production/packages/${id}/recipes`, "POST", input, key); },
      createSet: (input, key) => call("sales", "/sales/sets", "POST", { ...input, uom_code: "EA" }, key),
      replaceSlots: async (id, input, key) => {
        return call("sales", `/sales/sets/${id}`, "PUT", input, key);
      },
      createSellable: (id, input, key) => call("production", `/production/sets/${id}/sellable-variant`, "POST", input, key),
      recordProgress: async (id, input) => { await call("sales", `/sales/dish-drafts/${id}/progress`, "POST", input); },
      completeDraft: async (id, input, key) => { await call("sales", `/sales/dish-drafts/${id}/complete`, "POST", input, key); },
    };
  }
  const previewCost = (content: DishContent) => call<CostPreview>("production", "/production/recipes/cost-preview", "POST", {
    servings: content.servings,
    lines: content.ingredients.filter(line => line.sku_ref).map(({ sku_ref, quantity, uom, yield_pct }) => ({ sku_ref, quantity, uom, yield_pct })),
    packages: content.seasonings.filter(line => line.package_ref).map(line => ({ sku_ref: line.package_ref, quantity: 1 })),
  });
  return { detail, context, complete, previewCost, getDraft: async (id: string) => draftSchema.parse((await call<{ draft: unknown }>("sales", `/sales/dish-drafts/${id}`)).draft) };
}
