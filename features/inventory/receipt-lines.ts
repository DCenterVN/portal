export type ReceiptLine = { key: string; sku: string; quantity: number; unitPrice?: number; priceScope?: string };
export type ReceiptLineRow = ReceiptLine & { uom?: string; unitPrice?: number; referencePrice?: number; amount: number | null };

export function validQuantity(quantity: number): boolean {
  const scaled = quantity * 1000;
  return quantity > 0 && Number.isSafeInteger(Math.round(scaled)) && Math.abs(scaled - Math.round(scaled)) < 0.000001;
}

export function lineAmount(quantity: number, unitPrice: number | undefined): number | null {
  if (!validQuantity(quantity) || unitPrice === undefined || !Number.isSafeInteger(unitPrice) || unitPrice < 0) return null;
  const product = BigInt(Math.round(quantity * 1000)) * BigInt(unitPrice);
  const dong = (product + 500n) / 1000n;
  return dong <= BigInt(Number.MAX_SAFE_INTEGER) ? Number(dong) : null;
}

export function receiptTotal(amounts: (number | null)[]): number | null {
  if (!amounts.length || amounts.some(amount => amount === null)) return null;
  const total = amounts.reduce<number>((sum, amount) => sum + (amount ?? 0), 0);
  return Number.isSafeInteger(total) ? total : null;
}

export function priceDeviation(actual: number | undefined, reference: number | undefined): number | null {
  if (actual === undefined || reference === undefined || !Number.isSafeInteger(actual) || actual < 0 || reference <= 0) return null;
  return (actual - reference) / reference * 100;
}
