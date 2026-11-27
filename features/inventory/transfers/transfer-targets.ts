import type { StoreBranch } from "@/features/products/store-branches";

export const transferTargets = (branches: StoreBranch[] | undefined, own: string) => (branches ?? []).filter(branch => branch.id !== own);
