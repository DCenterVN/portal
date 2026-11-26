"use client";

import { useStockOverview } from "./use-stock-overview";
import { StockOverviewView } from "./stock-overview-view";

export function StockOverviewContainer() {
  return <StockOverviewView {...useStockOverview()} />;
}
