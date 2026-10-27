"use client";

import { GoodsReceiptView } from "./goods-receipt-form";
import { useGoodsReceipt } from "./use-goods-receipt";

export function GoodsReceiptPage() {
  return <GoodsReceiptView {...useGoodsReceipt()} />;
}
