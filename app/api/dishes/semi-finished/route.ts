import crypto from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { allPages } from "@/lib/api/all-pages";
import { safeMessage } from "@/lib/api/dishes";
import { createSemiFinishedSchema, slotOfSemiKind, type SemiFinishedItem, type SemiKind, type SemiSlot } from "@/lib/api/semi-finished";
import { forwardService, serviceUrl } from "@/lib/api/service-bff";
import { normalizeText } from "@/lib/dishes/types";

const BTP_PRODUCT_SLUG = "btp-bep-trung-tam";
const BTP_PRODUCT_NAME = "Bán thành phẩm bếp trung tâm";
const KIND_PREFIX: Record<SemiKind, string> = {
  COT: "BTP-COT-",
  SOT: "BTP-SOT-",
  NUOC_CHAM: "BTP-CHAM-",
  DO_CHUA: "BTP-CHUA-",
};

function kindFromPackageCode(code: string): SemiKind | null {
  if (code.startsWith("BTP-SOT-") || code.startsWith("VN-PACK-SOT-")) return "SOT";
  if (code.startsWith("BTP-COT-") || code.startsWith("VN-PACK-COT-")) return "COT";
  if (code.startsWith("BTP-CHAM-") || code.startsWith("VN-PACK-CHAM-")) return "NUOC_CHAM";
  if (code.startsWith("BTP-CHUA-")) return "DO_CHUA";
  return null;
}

type UpstreamPackage = {
  id: string;
  code: string;
  name: string;
  variant_label: string;
  net_weight_g: number;
  status: string;
  updated_at: string;
};

type UpstreamRecipe = {
  components: { sku_ref: string; name?: string | null; inactive?: boolean; quantity: string; uom: string; yield_pct: string; prep_note?: string }[];
  prep_steps?: { instruction: string; duration_seconds: number }[];
};

type UpstreamLabels = {
  allergen_summary?: { known: boolean; contains: string[] };
};

function caller(request: NextRequest) {
  const baseUrls = { sales: serviceUrl("sales"), production: serviceUrl("production") };
  return async function call<T>(service: "sales" | "production", path: string, method: "GET" | "POST" | "DELETE" = "GET", body?: unknown, key?: string): Promise<T> {
    const headers = new Headers(request.headers);
    headers.delete("idempotency-key");
    if (key) headers.set("Idempotency-Key", key);
    if (body !== undefined) headers.set("Content-Type", "application/json");
    const forwarded = new NextRequest(request.url, { method, headers, signal: request.signal, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
    const res = await forwardService(forwarded, { baseUrl: baseUrls[service], path, method, bodyPolicy: body === undefined ? "none" : "required", unavailableMessage: "Dịch vụ bán thành phẩm hiện không khả dụng" });
    if (res.status === 204) return undefined as T;
    const data = await res.json();
    if (!res.ok) throw Object.assign(new Error(typeof data.message === "string" ? data.message : "Không xử lý được bán thành phẩm"), { status: res.status, body: data });
    return (data.data ?? data) as T;
  };
}

async function computeAllergens(call: ReturnType<typeof caller>, rawIds: string[]): Promise<Record<string, string[] | null>> {
  const unique = [...new Set(rawIds)];
  const entries = await Promise.all(unique.map(async sku => {
    try {
      const labels = await call<UpstreamLabels>("sales", `/sales/skus/${encodeURIComponent(sku)}/labels`);
      const summary = labels.allergen_summary;
      return [sku, summary?.known ? summary.contains : null] as const;
    } catch {
      return [sku, null] as const;
    }
  }));
  return Object.fromEntries(entries);
}

function mergePackageAllergens(components: { sku_ref: string }[], bySku: Record<string, string[] | null>): string[] | null {
  if (!components.length) return [];
  const merged = new Set<string>();
  for (const c of components) {
    const list = bySku[c.sku_ref];
    if (list === null || list === undefined) return null;
    for (const item of list) merged.add(item);
  }
  return [...merged].sort();
}

type UpstreamProductRow = { id?: string; slug?: string; product?: { id: string; slug: string } };
const unwrapProduct = (row: UpstreamProductRow) => row.product ?? (row.id && row.slug ? { id: row.id, slug: row.slug } : null);

async function ensureSemiProduct(call: ReturnType<typeof caller>): Promise<string> {
  const products = await allPages<UpstreamProductRow>(cursor => {
    const q = new URLSearchParams({ page_size: "100", ...(cursor ? { cursor } : {}) });
    return call<{ items: UpstreamProductRow[]; next_cursor: string | null }>("sales", `/sales/products?${q}`);
  });
  const existing = products.map(unwrapProduct).find(p => p?.slug === BTP_PRODUCT_SLUG);
  if (existing) return existing.id;
  try {
    const created = await call<{ product: { id: string } }>("sales", "/sales/products", "POST", { name: BTP_PRODUCT_NAME, slug: BTP_PRODUCT_SLUG }, crypto.randomUUID());
    return created.product.id;
  } catch (err) {
    if (err && typeof err === "object" && "status" in err && err.status === 409) {
      const reload = await allPages<UpstreamProductRow>(cursor => {
        const q = new URLSearchParams({ page_size: "100", ...(cursor ? { cursor } : {}) });
        return call<{ items: UpstreamProductRow[]; next_cursor: string | null }>("sales", `/sales/products?${q}`);
      });
      const hit = reload.map(unwrapProduct).find(p => p?.slug === BTP_PRODUCT_SLUG);
      if (hit) return hit.id;
    }
    throw err;
  }
}

export async function GET(request: NextRequest) {
  try {
    const call = caller(request);
    const allPackages = await allPages<UpstreamPackage>(cursor => {
      const q = new URLSearchParams({ limit: "100", ...(cursor ? { cursor } : {}) });
      return call<{ items: UpstreamPackage[]; next_cursor: string | null }>("sales", `/sales/packages?${q}`);
    });
    const semiPackages = allPackages
      .filter(pkg => pkg.status === "ACTIVE" && kindFromPackageCode(pkg.code) !== null)
      .sort((a, b) => a.name.localeCompare(b.name, "vi"));
    const recipes = await Promise.all(semiPackages.map(async pkg => {
      try {
        const hist = await call<{ current: UpstreamRecipe | null }>("production", `/production/packages/${encodeURIComponent(pkg.id)}/recipes`);
        return [pkg.id, hist.current] as const;
      } catch {
        return [pkg.id, null] as const;
      }
    }));
    const recipeMap = new Map<string, UpstreamRecipe | null>(recipes);
    const rawIds = semiPackages.flatMap(pkg => (recipeMap.get(pkg.id)?.components ?? []).map(c => c.sku_ref));
    const allergensBySku = await computeAllergens(call, rawIds);
    const items: SemiFinishedItem[] = semiPackages.flatMap(pkg => {
      const kind = kindFromPackageCode(pkg.code);
      const recipe = recipeMap.get(pkg.id) ?? null;
      if (!kind || !recipe?.components?.length) return [];
      return [{
        id: pkg.id,
        code: pkg.code,
        name: pkg.name,
        slot: slotOfSemiKind(kind),
        kind,
        variant_label: pkg.variant_label,
        net_weight_g: pkg.net_weight_g,
        updated_at: pkg.updated_at,
        components: recipe.components,
        instruction: recipe.prep_steps?.[0]?.instruction ?? null,
        allergens: mergePackageAllergens(recipe.components, allergensBySku),
      }];
    });
    return NextResponse.json({ items }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    const status = error && typeof error === "object" && "status" in error && typeof error.status === "number" ? error.status : 500;
    return NextResponse.json({ message: safeMessage(error instanceof Error ? error.message : "Không tải được danh sách bán thành phẩm") }, { status, headers: { "Cache-Control": "no-store" } });
  }
}

export async function POST(request: NextRequest) {
  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return NextResponse.json({ message: "Dữ liệu không hợp lệ" }, { status: 400 });
  }
  const parsed = createSemiFinishedSchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json({ message: parsed.error.issues[0]?.message ?? "Dữ liệu bán thành phẩm chưa hợp lệ" }, { status: 422 });
  }
  const input = parsed.data;
  const kind: SemiKind = input.kind ?? input.slot ?? "DO_CHUA";
  const slot: SemiSlot = slotOfSemiKind(kind);
  const call = caller(request);
  const clientKey = request.headers.get("Idempotency-Key")?.trim() || crypto.randomUUID();
  const codeSuffix = crypto.createHash("sha256").update(clientKey).digest("hex").slice(0, 8).toUpperCase();
  let createdPackageId = "";
  try {
    const productRef = await ensureSemiProduct(call);
    const cleanName = normalizeText(input.name);
    const code = `${KIND_PREFIX[kind]}${codeSuffix}`;
    const pkg = await call<UpstreamPackage>("sales", "/sales/packages", "POST", {
      product_ref: productRef,
      code,
      name: cleanName,
      variant_label: `1 túi · ${input.net_weight_g} g`,
      net_weight_g: input.net_weight_g,
      uom_code: "EA",
      temperature_regime: "CHILLED",
    }, `${clientKey}:pkg`);
    createdPackageId = pkg.id;
    const components = input.components.map(line => {
      const prep = line.prep_note ? normalizeText(line.prep_note) : "";
      return {
        sku_ref: line.sku_ref,
        quantity: line.quantity,
        uom: line.uom,
        yield_pct: line.yield_pct,
        ...(prep ? { prep_note: prep } : {}),
      };
    });
    const instruction = input.instruction ? normalizeText(input.instruction) : "";
    const recipe = await call<UpstreamRecipe>("production", `/production/packages/${encodeURIComponent(pkg.id)}/recipes`, "POST", {
      components,
      prep_steps: instruction ? [{ instruction, duration_seconds: 0 }] : [],
    }, `${clientKey}:rec`);
    const allergensBySku = await computeAllergens(call, components.map(c => c.sku_ref));
    const item: SemiFinishedItem = {
      id: pkg.id,
      code: pkg.code,
      name: pkg.name,
      slot,
      kind,
      variant_label: pkg.variant_label,
      net_weight_g: pkg.net_weight_g,
      updated_at: pkg.updated_at,
      components: recipe.components,
      instruction: instruction || null,
      allergens: mergePackageAllergens(recipe.components, allergensBySku),
    };
    return NextResponse.json({ item }, { status: 201, headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (createdPackageId) {
      await call("sales", `/sales/packages/${encodeURIComponent(createdPackageId)}`, "DELETE", undefined, `${clientKey}:del`).catch(() => undefined);
    }
    const status = error && typeof error === "object" && "status" in error && typeof error.status === "number" ? error.status : 500;
    return NextResponse.json({ message: safeMessage(error instanceof Error ? error.message : "Không tạo được bán thành phẩm") }, { status, headers: { "Cache-Control": "no-store" } });
  }
}
