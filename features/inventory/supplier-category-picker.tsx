"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Field } from "@/components/patterns/form-field";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/patterns/empty-state";
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
    {selected.some(code => !known.includes(code)) && <div><dd className="text-xs text-muted-foreground">Nhóm cũ cần chọn lại</dd></div>}
    {categories.filter(parent => parent.children.some(child => selected.includes(child.code))).map(parent => <div key={parent.code}>
      <dt className="text-xs font-semibold text-muted-foreground">{parent.name}</dt>
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
    <Field label={t("search")} htmlFor="supplier-category-search"><Input id="supplier-category-search" type="search" value={search} onChange={event => setSearch(event.target.value)} disabled={disabled} /></Field>
    <div role="group" aria-label={t("selected")} className="rounded-lg border border-border bg-tint p-3">
      <p className="mb-2 text-sm font-semibold" aria-live="polite">{t("selectedCount", { count: selected.length })}</p>
      {selected.length ? <SupplierCategoryGroups categories={categories} selected={selected} /> : <p className="text-xs text-muted-foreground">{t("noSelection")}</p>}
    </div>
    {shown.length === 0 ? <EmptyState title={t("noMatches")} /> : <div className="grid gap-3">
      {shown.map(parent => {
        const allCodes = categories.find(item => item.code === parent.code)?.children.map(child => child.code) ?? [];
        return <div key={parent.code} role="group" aria-label={parent.name} className="rounded-lg border border-border p-3">
          <Label className="min-h-11 w-full cursor-pointer">
            <Checkbox checked={categoryCheckState(selected, allCodes)} aria-label={parent.name} disabled={disabled} onCheckedChange={checked => onChange(toggleCategorySelection(selected, allCodes, checked === true))} />
            <span className="font-semibold">{parent.name}</span><span aria-hidden="true" className="ml-auto text-xs text-muted-foreground">{allCodes.filter(code => selected.includes(code)).length}/{allCodes.length}</span>
          </Label>
          <div className="ml-4 grid border-l border-border pl-3">
            {parent.children.map(child => <Label key={child.code} className="min-h-11 w-full cursor-pointer"><Checkbox checked={selected.includes(child.code)} disabled={disabled} onCheckedChange={checked => onChange(toggleCategorySelection(selected, [child.code], checked === true))} />{child.name}</Label>)}
          </div>
        </div>;
      })}
    </div>}
  </div>;
}
