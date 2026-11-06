import { describe, expect, it } from "vitest";
import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { Command } from "@/components/ui/command";
import { EntityList, EntityPicker, entityMatcher, filterEntities, type EntityPickerProps } from "./entity-picker";

interface Company { id: string; name: string; code: string }
interface Product { id: string; sku_code: string; name: string; temperature_regime: string }

const COMPANIES: Company[] = [
  { id: "0192f0a1-7c3e-7b2a-9d4e-1a2b3c4d5e01", name: "Công ty Đà Lạt Xanh", code: "DLX" },
  { id: "0192f0a1-7c3e-7b2a-9d4e-1a2b3c4d5e02", name: "Bếp Sài Gòn", code: "BSG-01" },
  { id: "0192f0a1-7c3e-7b2a-9d4e-1a2b3c4d5e03", name: "Nông trại Hữu Cơ", code: "NTHC" },
];

const base: EntityPickerProps<Company> = {
  label: "Công ty", name: "root_branch_id", items: COMPANIES, status: "ready",
  getId: (company) => company.id, getLabel: (company) => company.name, getMeta: (company) => company.code,
  required: true, placeholder: "Tìm theo tên hoặc mã công ty",
};
const html = (props: Partial<EntityPickerProps<Company>> = {}) => renderToStaticMarkup(<EntityPicker {...base} {...props} />);
const list = (props: { picked?: string | null; options?: Company[] } = {}) => renderToStaticMarkup(
  <Command shouldFilter={false}>
    <EntityList options={props.options ?? COMPANIES} picked={props.picked ?? null} onPick={() => {}} emptyMessage="Không tìm thấy" getId={base.getId} getLabel={base.getLabel} getMeta={base.getMeta} />
  </Command>,
);
const DISABLED = /\sdisabled=/;
const visibleText = (markup: string) => markup.replace(/<[^>]*>/g, " ");
const names = (query: string, filter = entityMatcher(base.getLabel, base.getMeta)) => filterEntities(COMPANIES, query, filter).map((company) => company.name);

describe("EntityPicker filter (FR-12)", () => {
  it.each([
    ["da lat", "Công ty Đà Lạt Xanh"],
    ["ĐÀ LẠT", "Công ty Đà Lạt Xanh"],
    ["huu co", "Nông trại Hữu Cơ"],
    ["bep sai", "Bếp Sài Gòn"],
    ["bsg-01", "Bếp Sài Gòn"],
    ["dlx", "Công ty Đà Lạt Xanh"],
  ])("query %s matches only %s (accent and case blind, name or code)", (query, match) => {
    expect(names(query)).toEqual([match]);
  });

  it("empty query lists everything and maxOptions caps the list", () => {
    expect(names("")).toHaveLength(3);
    expect(filterEntities(COMPANIES, "", entityMatcher(base.getLabel), 2)).toHaveLength(2);
  });

  it("no match offers nothing; a custom filter replaces the default one", () => {
    expect(names("zzz")).toEqual([]);
    const byCode = (company: Company, query: string) => company.code === query;
    expect(names("NTHC", byCode)).toEqual(["Nông trại Hữu Cơ"]);
    expect(names("nông", byCode)).toEqual([]);
  });
});

describe("EntityPicker options", () => {
  it("shows the code as secondary text next to the name and marks the picked one", () => {
    const markup = list({ picked: COMPANIES[1].id });
    expect(markup).toMatch(/Bếp Sài Gòn.*BSG-01/);
    expect(markup).toContain('role="option"');
    expect(markup.match(/lucide-check/g)).toHaveLength(1);
  });

  it("product case: SKU · temperature as meta", () => {
    const products: Product[] = [{ id: "0192f0a1-0000-7000-8000-00000000aa02", sku_code: "SKU-THIT-02", name: "Thịt bò", temperature_regime: "FROZEN" }];
    const markup = renderToStaticMarkup(
      <Command shouldFilter={false}>
        <EntityList options={products} picked={null} onPick={() => {}} emptyMessage="" getId={(p) => p.id} getLabel={(p) => p.name} getMeta={(p) => `${p.sku_code} · ${p.temperature_regime}`} />
      </Command>,
    );
    expect(markup).toContain("SKU-THIT-02 · FROZEN");
  });
});

describe("EntityPicker sends the id, shows the name", () => {
  it("a controlled value shows its name; the id rides only in the form input", () => {
    const markup = html({ value: COMPANIES[0].id });
    expect(visibleText(markup)).toContain("Công ty Đà Lạt Xanh");
    for (const company of COMPANIES) expect(visibleText(markup)).not.toContain(company.id);
    expect(markup.match(/value="0192[^"]*"/g)).toEqual([`value="${COMPANIES[0].id}"`]);
    expect(markup).toMatch(/<input[^>]*name="root_branch_id"/);
  });

  it("nothing picked shows the placeholder and an empty value", () => {
    const markup = html();
    expect(visibleText(markup)).toContain("Tìm theo tên hoặc mã công ty");
    expect(markup).toMatch(/<input[^>]*name="root_branch_id"[^>]*value=""/);
  });

  it("serializeValue=false keeps the id out of the DOM", () => {
    const markup = html({ serializeValue: false, value: COMPANIES[0].id });
    expect(markup).not.toContain(COMPANIES[0].id);
    expect(markup).not.toContain('name="root_branch_id"');
  });

  it("is a combobox wired to its label, required and collapsed", () => {
    const markup = html();
    const trigger = markup.match(/<button[^>]*role="combobox"[^>]*>/)?.[0] ?? "";
    expect(trigger).toContain('id="root_branch_id-picker"');
    expect(trigger).toContain('aria-required="true"');
    expect(trigger).toContain('aria-expanded="false"');
    expect(trigger).not.toMatch(DISABLED);
    expect(markup).toContain('for="root_branch_id-picker"');
  });

  it("a server error is shown at the field and marks it invalid", () => {
    const markup = html({ error: "Công ty đã ngừng hoạt động" });
    expect(markup).toContain(">Công ty đã ngừng hoạt động</div>");
    expect(markup).toContain('aria-invalid="true"');
  });
});

describe("EntityPicker states fail closed", () => {
  it("loading announces Đang tải… and the trigger is disabled", () => {
    const markup = html({ status: "loading", items: undefined });
    expect(markup).toContain("Đang tải…");
    expect(markup.match(/<button[^>]*role="combobox"[^>]*>/)?.[0]).toMatch(DISABLED);
  });

  it("empty list shows emptyText", () => {
    expect(html({ items: [], emptyText: "Chưa có công ty nào." })).toContain("Chưa có công ty nào.");
  });

  it("error disables the trigger, says so, and offers Thử lại only with onRetry", () => {
    const markup = html({ status: "error", onRetry: () => {} });
    expect(markup).toContain('role="alert"');
    expect(markup).toContain("Thử lại");
    expect(markup.match(/<button[^>]*role="combobox"[^>]*>/)?.[0]).toMatch(DISABLED);
    expect(html({ status: "error" })).not.toContain("Thử lại");
  });
});
