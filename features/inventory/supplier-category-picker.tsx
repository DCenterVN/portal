"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, TextInput } from "@/components/ui/field";
import { EmptyState } from "@/components/ui/state";
import { categoryCheckState, toggleCategorySelection, type useSupplierCategories } from "./use-supplier-form";

type SupplierCategoryTree = NonNullable<ReturnType<typeof useSupplierCategories>["categories"]>;
type SupplierCategoryPickerProps = {
  categories: SupplierCategoryTree; selected: string[];
  onChange: (codes: string[]) => void; disabled?: boolean;
};
type SupplierCategoryGroupsProps = { categories: SupplierCategoryTree; selected: string[] };

export function SupplierCategoryGroups({ categories, selected }: SupplierCategoryGroupsProps) {
  const known = categories.flatMap(parent => parent.children.map(child => child.code));
  return <dl className="grid gap-2">
    {selected.some(code => !known.includes(code)) && <div><dd className="text-xs text-fg-3">Nhóm cũ cần chọn lại</dd></div>}
    {categories.filter(parent => parent.children.some(child => selected.includes(child.code))).map(parent => <div key={parent.code}>
      <dt className="text-xs font-semibold text-fg-3">{parent.name}</dt>
      <dd className="mt-1 flex flex-wrap gap-1.5">{parent.children.filter(child => selected.includes(child.code)).map(child => <span key={child.code} className="rounded-full bg-tint px-2 py-1 text-sm">{child.name}</span>)}</dd>
    </div>)}
  </dl>;
}

function searchName(value: string) {
  return value.normalize("NFD").replace(/\p{Diacritic}/gu, "").replace(/đ/gi, "d").toLocaleLowerCase("vi-VN");
}

export function SupplierCategoryPicker({ categories, selected, onChange, disabled }: SupplierCategoryPickerProps) {
  const t = useTranslations("supplierForm");
  const [search, setSearch] = useState("");
  const query = searchName(search.trim());
  const shown = categories.map(parent => ({ ...parent, children: searchName(parent.name).includes(query) ? parent.children : parent.children.filter(child => searchName(child.name).includes(query)) })).filter(parent => parent.children.length);
  return <div className="grid gap-3">
    <Field label={t("search")} htmlFor="supplier-category-search"><TextInput id="supplier-category-search" type="search" value={search} onChange={event => setSearch(event.target.value)} disabled={disabled} /></Field>
    <div role="group" aria-label={t("selected")} className="rounded-lg border border-line bg-tint p-3">
      <p className="mb-2 text-sm font-semibold" aria-live="polite">{t("selectedCount", { count: selected.length })}</p>
      {selected.length ? <SupplierCategoryGroups categories={categories} selected={selected} /> : <p className="text-xs text-fg-3">{t("noSelection")}</p>}
    </div>
    {shown.length === 0 ? <EmptyState title={t("noMatches")} /> : <div className="grid gap-3">
      {shown.map(parent => {
        const allCodes = categories.find(item => item.code === parent.code)?.children.map(child => child.code) ?? [];
        return <div key={parent.code} role="group" aria-label={parent.name} className="rounded-lg border border-line p-3">
          <Checkbox checked={categoryCheckState(selected, allCodes)} aria-label={parent.name} disabled={disabled} onCheckedChange={checked => onChange(toggleCategorySelection(selected, allCodes, checked))} className="min-h-11 w-full">
            <span className="font-semibold">{parent.name}</span><span aria-hidden="true" className="ml-auto text-xs text-fg-3">{allCodes.filter(code => selected.includes(code)).length}/{allCodes.length}</span>
          </Checkbox>
          <div className="ml-4 grid border-l border-line pl-3">
            {parent.children.map(child => <Checkbox key={child.code} checked={selected.includes(child.code)} disabled={disabled} onCheckedChange={checked => onChange(toggleCategorySelection(selected, [child.code], checked))} className="min-h-11 w-full">{child.name}</Checkbox>)}
          </div>
        </div>;
      })}
    </div>}
  </div>;
}
