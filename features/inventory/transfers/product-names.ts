type Named = { name: string; sku_ref?: string; variants?: Array<{ id: string }> };

export function productNames(products: Named[]) {
  const names = new Map<string, string>();
  for (const product of products) {
    if (product.sku_ref) names.set(product.sku_ref, product.name);
    for (const variant of product.variants ?? []) names.set(variant.id, product.name);
  }
  return names;
}
