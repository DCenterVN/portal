import { globSync, readFileSync } from "node:fs";
import ts from "typescript";
import { describe, expect, it } from "vitest";

// FR-2 / FR-12 UI rules. Debt lives in app/ui-rules-baseline.txt: `<rule>\t<file>:<key>\t<B#|->`, shrink-only.
// Keys are `<file>:<token or field>` with `#n` for the n-th repeat, so editing other lines never shifts them.
const BASELINE = "app/ui-rules-baseline.txt";
const BLUR_ALLOW = new Set([
  "components/layout/store-header.tsx", "components/layout/console-header.tsx", "components/ui/popover.tsx",
  "components/ui/drawer.tsx", "components/ui/sheet.tsx",
]);
const COLOR = /#[\da-f]{3,8}\b|rgba?\(/gi;
const RADIUS = /(?:^|:)!?rounded(?:-(?:[trblse]|tl|tr|br|bl|ss|se|es|ee))?(?:-(\S+))?$/;
const RADIUS_OK = /^(?:none|\[2px\]|sm|lg|xl|full|\[var\(--r-[\w-]+\)\])$/;
const DURATION = /(?:^|:)!?duration-(\S+)$/;
const EMOJI = /\p{Emoji_Presentation}|\p{Extended_Pictographic}️/u;
const ID_TEXT = /\bUUID\b|\bID\b|\bref\b/i;
const TEXT_CONTROLS = new Set(["Input", "TextInput", "input", "Field"]);
// Codes the user already knows (not entity ids), keyed by file + name so the name stays banned elsewhere.
const RAW_ID_ALLOW = new Set([
  "features/platform/company-modules.tsx:contract_ref", // contract number from the paper contract
  "features/platform/support-request-form.tsx:ticket_ref", // external support ticket code, optional
]);

const isWhite = (color: string) => /^#fff$/i.test(color);
const hasRawColor = (text: string) => (text.match(COLOR) ?? []).some((color) => !isWhite(color));

function classViolations(file: string, text: string, onButton: boolean): string[] {
  return text.split(/\s+/).filter(Boolean).flatMap((token) => {
    const radius = token.match(RADIUS);
    const duration = token.match(DURATION);
    const arbitrary = token.match(/\[([^\]]*)\]/)?.[1] ?? "";
    return [
      /-\[(?:#|rgba?\()/.test(token) && hasRawColor(arbitrary) ? "hex" : "",
      radius && radius[1] !== undefined && !RADIUS_OK.test(radius[1]) ? "rounded" : "",
      /(?:^|:)!?rounded-full$/.test(token) && (onButton || file === "components/ui/button.tsx") ? "button-pill" : "",
      /(?:^|:)!?backdrop-blur/.test(token) && !BLUR_ALLOW.has(file) ? "blur" : "",
      duration && !/^(?:100|150|200|300|400)$/.test(duration[1]) ? "duration" : "",
    ].filter(Boolean).map((rule) => `${rule}\t${file}:${token}`);
  });
}

function attrText(element: ts.JsxOpeningLikeElement, name: string): string | undefined {
  for (const attribute of element.attributes.properties) {
    if (!ts.isJsxAttribute(attribute) || attribute.name.getText() !== name || !attribute.initializer) continue;
    const value = ts.isJsxExpression(attribute.initializer) ? attribute.initializer.expression : attribute.initializer;
    return value && ts.isStringLiteralLike(value) ? value.text : undefined;
  }
  return undefined;
}

function rawIdViolation(file: string, element: ts.JsxOpeningLikeElement, inheritedLabel?: string): string[] {
  if (attrText(element, "type") === "hidden") return [];
  const name = attrText(element, "name");
  if (name && RAW_ID_ALLOW.has(`${file}:${name}`)) return [];
  const label = attrText(element, "label") ?? inheritedLabel;
  const placeholder = attrText(element, "placeholder");
  const hit = (name && /_(?:id|ref)$/i.test(name)) || [label, placeholder].some((text) => text && ID_TEXT.test(text));
  if (!hit) return [];
  const key = name ? `name=${name}` : label && ID_TEXT.test(label) ? `label=${label}` : `placeholder=${placeholder}`;
  return [`raw-id\t${file}:${key}`];
}

function scan(file: string, source: string): string[] {
  const tree = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const found: string[] = [];
  const visit = (node: ts.Node, ctx: { style: boolean; button: boolean; label?: string }) => {
    if (ts.isJsxElement(node) && node.openingElement.tagName.getText() === "Field") {
      const label = attrText(node.openingElement, "label") ?? ctx.label;
      node.openingElement.attributes.forEachChild((child) => visit(child, ctx));
      node.children.forEach((child) => visit(child, { ...ctx, label }));
      return;
    }
    if (ts.isJsxOpeningLikeElement(node)) {
      const tag = node.tagName.getText();
      if (TEXT_CONTROLS.has(tag)) found.push(...rawIdViolation(file, node, ctx.label));
      node.attributes.properties.forEach((attribute) => visit(attribute, {
        ...ctx,
        style: ts.isJsxAttribute(attribute) && attribute.name.getText() === "style",
        button: tag === "Button" && ts.isJsxAttribute(attribute) && attribute.name.getText() === "className",
      }));
      return;
    }
    if (ts.isJsxText(node) && EMOJI.test(node.text)) found.push(`emoji\t${file}:${node.text.trim()}`);
    if (ts.isStringLiteralLike(node) || ts.isTemplateLiteralToken(node)) {
      const text = (node as ts.LiteralLikeNode).text;
      if (ctx.style && hasRawColor(text)) found.push(`hex\t${file}:${text}`);
      if (!ctx.style) found.push(...classViolations(file, text, ctx.button));
      if (EMOJI.test(text) && (ts.isJsxAttribute(node.parent) || ts.isJsxExpression(node.parent))) {
        found.push(`emoji\t${file}:${text}`);
      }
    }
    ts.forEachChild(node, (child) => visit(child, ctx));
  };
  visit(tree, { style: false, button: false });
  const seen = new Map<string, number>();
  return found.map((line) => {
    const n = (seen.get(line) ?? 0) + 1;
    seen.set(line, n);
    return n === 1 ? line : `${line}#${n}`;
  });
}

function repoViolations(): string[] {
  const files = globSync("{app,features,components,lib}/**/*.{ts,tsx}")
    .filter((file) => !/\.test\.tsx?$/.test(file) && !file.startsWith("mocks/")).sort();
  return files.flatMap((file) => scan(file, readFileSync(file, "utf8")));
}

function baseline(): string[] {
  return readFileSync(BASELINE, "utf8").split("\n").filter((line) => line.trim() && !line.startsWith("#"))
    .map((line) => line.split("\t").slice(0, 2).join("\t"));
}

const rulesOf = (file: string, source: string) => scan(file, source).map((line) => line.split("\t")[0]);

describe("ui rules gate (FR-2, FR-12)", () => {
  it("repo has no violation outside the baseline", () => {
    const known = new Set(baseline());
    expect(repoViolations().filter((line) => !known.has(line))).toEqual([]);
  });

  it("baseline has no stale line (shrink-only)", () => {
    const actual = new Set(repoViolations());
    expect(baseline().filter((line) => !actual.has(line))).toEqual([]);
  });
});

it.each([
  ["hex", "features/x/a.tsx", '<div className="bg-[#0284c7] p-2" />'],
  ["hex", "features/x/a.tsx", '<div className="hover:text-[rgb(1,2,3)]" />'],
  ["hex", "features/x/a.tsx", '<div style={{ color: "#333" }} />'],
  ["hex", "features/x/a.tsx", '<div style={{ border: "1px solid rgba(0,0,0,.1)" }} />'],
  ["rounded", "features/x/a.tsx", '<div className="rounded-md" />'],
  ["rounded", "features/x/a.tsx", '<div className="md:rounded-2xl" />'],
  ["rounded", "components/ui/a.tsx", 'const c = cva("rounded-3xl px-2");'],
  ["rounded", "features/x/a.tsx", '<div className="rounded-t-[10px]" />'],
  ["rounded", "features/x/a.tsx", '<div className="rounded-[var(--radius-md)]" />'],
  ["button-pill", "features/x/a.tsx", '<Button className="rounded-full">Mua</Button>'],
  ["button-pill", "components/ui/button.tsx", 'const v = cva("inline-flex", { variants: { size: { pill: "rounded-full" } } });'],
  ["blur", "features/x/a.tsx", '<div className="backdrop-blur-md" />'],
  ["blur", "components/layout/console-shell.tsx", '<div className="supports-[backdrop-filter]:backdrop-blur" />'],
  ["duration", "features/x/a.tsx", '<div className="transition duration-250" />'],
  ["duration", "features/x/a.tsx", '<div className="duration-[350ms]" />'],
  ["emoji", "features/x/a.tsx", "<p>Đã lưu ✅</p>"],
  ["emoji", "features/x/a.tsx", '<Badge title="🎉 mới" />'],
  ["raw-id", "features/x/a.tsx", '<TextInput name="root_branch_id" />'],
  ["raw-id", "features/x/a.tsx", '<input placeholder="UUID lô thành phẩm" />'],
  ["raw-id", "features/x/a.tsx", '<Field label="Product UUID" value={v} onChange={set} />'],
  ["raw-id", "features/x/a.tsx", '<Field label="User ID" htmlFor="u"><TextInput id="u" /></Field>'],
  ["raw-id", "features/x/a.tsx", '<Input label="Order ref" />'],
  ["raw-id", "features/x/a.tsx", '<Input name="price_book_ref" />'],
  ["raw-id", "features/platform/staff-view.tsx", '<TextInput name="contract_ref" />'],
])("rule %s catches fixture in %s: %s", (rule, file, source) => {
  expect(rulesOf(file, source)).toContain(rule);
});

it.each([
  ["features/x/a.tsx", '<Button className="text-[#fff]" style={{ color: "#FFF" }} />'],
  ["features/x/a.tsx", '<div className="rounded rounded-none rounded-[2px] rounded-sm rounded-lg rounded-xl rounded-full rounded-t-lg rounded-[var(--r-8)]" />'],
  ["features/x/a.tsx", '<div className="bg-[var(--color-surface)] text-[var(--color-ink)]" />'],
  ["components/layout/store-header.tsx", '<header className="backdrop-blur-md" />'],
  ["components/ui/popover.tsx", '<div className="backdrop-blur" />'],
  ["features/x/a.tsx", '<div className="duration-100 duration-150 duration-200 duration-300 md:duration-400" />'],
  ["features/x/a.tsx", "<p>Mũi tên → và © 2026</p>"],
  ["features/x/a.tsx", 'const label = "✅ not jsx";'],
  ["features/x/a.tsx", '<input type="hidden" name="branch_id" />'],
  ["features/x/a.tsx", '<Field label="Công ty" htmlFor="c"><Select id="c" name="company_id" /></Field>'],
  ["features/x/a.tsx", '<Field label="Mã kệ" htmlFor="s"><TextInput id="s" name="shelf_code" placeholder="VD: KE-01" /></Field>'],
  ["features/x/a.tsx", '<TextInput name="identity" placeholder="Ví dụ: vid, idle, prefer" />'],
  ["features/platform/company-modules.tsx", '<TextInput name="contract_ref" />'],
])("accepts clean fixture in %s: %s", (file, source) => {
  expect(scan(file, source)).toEqual([]);
});

it("keys are line-independent and count repeats", () => {
  const one = scan("features/x/a.tsx", '<div className="rounded-md" />');
  const moved = scan("features/x/a.tsx", '\n\n<div className="p-2 rounded-md" />');
  expect(moved).toEqual(one);
  expect(scan("features/x/a.tsx", '<div className="rounded-md" /><div className="rounded-md" />'))
    .toEqual(["rounded\tfeatures/x/a.tsx:rounded-md", "rounded\tfeatures/x/a.tsx:rounded-md#2"]);
});
