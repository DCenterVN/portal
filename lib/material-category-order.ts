export const MATERIAL_CATEGORY_ORDER = [
  "THIT",
  "CA_LOAI",
  "THUY_HAI_SAN",
  "TRUNG_SUA",
  "DO_CHE_BIEN",
  "RAU_CU",
  "CU_QUA",
  "NAM",
  "TRAI_CAY",
  "GAO_NGU_COC",
  "DO_KHO",
  "GIA_VI",
  "COT_NUOC_DUNG",
] as const;

export function materialCategoryRank(code: string): number {
  const index = MATERIAL_CATEGORY_ORDER.indexOf(code.trim().toUpperCase() as (typeof MATERIAL_CATEGORY_ORDER)[number]);
  return index === -1 ? MATERIAL_CATEGORY_ORDER.length : index;
}
