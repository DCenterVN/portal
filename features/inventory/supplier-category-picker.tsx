"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { ChevronDown, ChevronUp, X } from "lucide-react";
import { Button } from "@/components/ui/button";
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

type SelectedChipsProps = { categories: SupplierCategoryTree; selected: string[]; onChange: (codes: string[]) => void; disabled?: boolean };
function SelectedChips({ categories, selected, onChange, disabled }: SelectedChipsProps) {
  const t = useTranslations("supplierForm");
  const chips = categories.flatMap(parent => parent.children.filter(child => selected.includes(child.code)));
  return <ul aria-label={t("selectedGroups")} className="flex flex-wrap gap-1.5">{chips.map(child => <li key={child.code} className="flex items-center gap-1 rounded-lg bg-background py-0.5 pl-3 pr-1 text-sm">
    {child.name}<Button type="button" variant="ghost" size="icon" disabled={disabled} aria-label={t("removeGroup", { name: child.name })} onClick={() => onChange(selected.filter(code => code !== child.code))}><X aria-hidden="true" className="size-3.5" /></Button>
  </li>)}</ul>;
}

function searchName(value: string) {
  return value.normalize("NFD").replace(/\p{Diacritic}/gu, "").replace(/đ/gi, "d").toLocaleLowerCase("vi-VN");
}

export function SupplierCategoryPicker({ categories, selected, onChange, disabled }: SupplierCategoryPickerProps) {
  const t = useTranslations("supplierForm");
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<string[]>([]);
  const query = searchName(search.trim());
  const shown = categories.map(parent => ({ ...parent, children: searchName(parent.name).includes(query) ? parent.children : parent.children.filter(child => searchName(child.name).includes(query)) })).filter(parent => parent.children.length);
  const toggle = (code: string) => setExpanded(items => items.includes(code) ? items.filter(item => item !== code) : [...items, code]);
  return <div className="grid gap-3">
    <Field label={t("search")} htmlFor="supplier-category-search"><Input id="supplier-category-search" type="search" value={search} onChange={event => setSearch(event.target.value)} disabled={disabled} /></Field>
    <div role="group" aria-label={t("selected")} className="rounded-lg bg-tint p-3">
      <p className={selected.length ? "mb-2 text-sm font-semibold" : "text-sm text-muted-foreground"} aria-live="polite">{selected.length ? t("selectedCount", { count: selected.length }) : t("noSelection")}</p>
      {selected.length > 0 && <SelectedChips categories={categories} selected={selected} onChange={onChange} disabled={disabled} />}
    </div>
    {shown.length === 0 ? <EmptyState title={t("noMatches")} /> : <div className="grid gap-x-6 sm:grid-cols-2">
      {shown.map(parent => {
        const allCodes = categories.find(item => item.code === parent.code)?.children.map(child => child.code) ?? [];
        const open = query !== "" || expanded.includes(parent.code);
        return <div key={parent.code} role="group" aria-label={parent.name}>
          <div className="flex items-center">
            <Label className="min-h-11 min-w-0 flex-1 cursor-pointer">
              <Checkbox checked={categoryCheckState(selected, allCodes)} aria-label={parent.name} disabled={disabled} onCheckedChange={checked => onChange(toggleCategorySelection(selected, allCodes, checked === true))} />
              <span className="font-semibold">{parent.name}</span><span aria-hidden="true" className="ml-auto text-xs text-muted-foreground">{allCodes.filter(code => selected.includes(code)).length}/{allCodes.length}</span>
            </Label>
            <Button type="button" variant="ghost" size="icon" aria-expanded={open} aria-label={t(open ? "collapseGroup" : "expandGroup", { name: parent.name })} disabled={disabled} onClick={() => toggle(parent.code)}>{open ? <ChevronUp aria-hidden="true" /> : <ChevronDown aria-hidden="true" />}</Button>
          </div>
          {open && <div className="ml-4 grid pl-3">
            {parent.children.map(child => <Label key={child.code} className="min-h-11 w-full cursor-pointer"><Checkbox checked={selected.includes(child.code)} disabled={disabled} onCheckedChange={checked => onChange(toggleCategorySelection(selected, [child.code], checked === true))} />{child.name}</Label>)}
          </div>}
        </div>;
      })}
    </div>}
  </div>;
}
