import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import ts from "typescript";
import { describe, expect, it } from "vitest";

const ROOT = process.cwd();
const SOURCE_DIRS = ["app", "features", "components", "lib"];

function sourceFiles(): string[] {
  const visit = (relative: string): string[] => readdirSync(path.join(ROOT, relative), { withFileTypes: true })
    .flatMap((entry) => {
      const child = path.join(relative, entry.name);
      if (entry.isDirectory()) return visit(child);
      return /\.(ts|tsx)$/.test(entry.name) ? [child] : [];
    });
  return SOURCE_DIRS.flatMap(visit);
}

function hasMockImport(source: string): boolean {
  return /(?:from\s*|import\s*\()["'][^"']*\/mocks\//.test(source);
}

function matches(pattern: RegExp): string[] {
  return sourceFiles().filter((file) => pattern.test(readFileSync(path.join(ROOT, file), "utf8")));
}

function violatesShellBoundary(file: string, source: string): boolean {
  if (/\.test\./.test(file)) return false;
  if (file.startsWith("app/") && file.endsWith("/page.tsx") && !/^app\/(?:\(store\)|\(console\)|\(auth\)|platform|company)\//.test(file)) return true;
  if (/from\s*["']@\/components\/navbar["']/.test(source)) return true;
  if (!/from\s*["']@\/components\/layout(?:\/|["'])/.test(source)) return false;
  return !/^app\/.*\/layout\.tsx$/.test(file) && file !== "app/layout.tsx" && file !== "app/not-found.tsx" &&
    !["features/store/store-frame.tsx", "features/console/console-frame.tsx", "features/platform/workspace.tsx"].includes(file);
}

function hasButtonOverride(source: string): boolean {
  const tree = ts.createSourceFile("fixture.tsx", source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const paletteOverride = /(?:^|\s|:)(?:text|bg|border|ring|from|to|via)-(?:black\b|white\b|(?:slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-\d+\b|\[#(?:[\da-f]{8}|[\da-f]{6}|[\da-f]{4}|[\da-f]{3})\])/i;
  let forbidden = false;
  const inspectClass = (node: ts.Node) => {
    if ((ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node) ||
      ts.isTemplateHead(node) || ts.isTemplateMiddle(node) || ts.isTemplateTail(node)) &&
      (/(?:bg-|rounded|h-[0-9]|px-)/.test(node.text) || paletteOverride.test(node.text))) forbidden = true;
    ts.forEachChild(node, inspectClass);
  };
  const visit = (node: ts.Node) => {
    if ((ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) && node.tagName.getText(tree) === "Button") {
      for (const attribute of node.attributes.properties) {
        if (ts.isJsxAttribute(attribute) && attribute.name.getText(tree) === "className" && attribute.initializer) {
          inspectClass(attribute.initializer);
        }
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(tree);
  return forbidden;
}

function buttonOverrideFiles(files: string[], readSource = (file: string) => readFileSync(path.join(ROOT, file), "utf8")): string[] {
  return files.filter((file) =>
    (file.startsWith("app/") || file.startsWith("features/") || file.startsWith("components/")) && !/\.test\./.test(file) &&
    hasButtonOverride(readSource(file))
  );
}

describe("layout architecture gate", () => {
  it("keeps main landmarks inside shell components", () => {
    const files = matches(/<main\b/).filter((file) => !/\.test\./.test(file));
    expect(files.sort()).toEqual([
      "components/layout/auth-shell.tsx",
      "components/layout/console-shell.tsx",
      "components/layout/store-shell.tsx",
      "features/platform/workspace.tsx",
    ]);
  });

  it("keeps backdrop blur out of application sources", () => {
    const files = matches(/backdrop-blur/).filter((file) => !/\.test\./.test(file));
    expect(files).toEqual([]);
  });

  it("allows mock imports only in frames and tests", () => {
    const invalid = sourceFiles().filter((file) => hasMockImport(readFileSync(path.join(ROOT, file), "utf8"))).filter((file) =>
      !/\.test\.[tj]sx?$/.test(file) &&
      file !== "features/store/store-frame.tsx" &&
      file !== "features/console/console-frame.tsx"
    );
    expect(invalid).toEqual([]);
  });

  it("rejects sample constants and hard-coded identity fixtures", () => {
    expect(matches(/\b(?:SAMPLE_|MOCK_)|Nguyễn Văn Quản|CN-HCM-/).filter((file) => !/\.test\./.test(file))).toEqual([]);
  });

  it("uses Button instead of raw buttons in app and features", () => {
    const invalid = matches(/<button\b/).filter((file) =>
      (file.startsWith("app/") || file.startsWith("features/")) && !/\.test\./.test(file)
    );
    expect(invalid).toEqual([]);
  });

  it("keeps Button color, radius, height, and padding in shared variants", () => {
    expect(buttonOverrideFiles(sourceFiles())).toEqual([]);
  });
});

it.each(["app/(auth)/fixture.tsx", "features/auth/fixture.tsx", "components/modals/fixture.tsx"])(
  "checks Button overrides in scope: %s", (file) => {
    expect(buttonOverrideFiles([file], () => '<Button className="rounded-xl" />')).toEqual([file]);
  }
);


describe("review regression gates", () => {
  it("AC-1(a): every page belongs to one of the five shell roots", () => {
    expect(sourceFiles().filter((file) => violatesShellBoundary(file, ""))).toEqual([]);
  });

  it("AC-1(b): only layouts, frames and workspace import shells", () => {
    const invalid = matches(/from\s*["']@\/components\/layout(?:\/|["'])/).filter((file) =>
      violatesShellBoundary(file, readFileSync(path.join(ROOT, file), "utf8")));
    expect(invalid).toEqual([]);
  });

  it("AC-1(c): no legacy navbar imports remain", () => {
    expect(matches(/from\s*["']@\/components\/navbar["']/).filter((file) =>
      violatesShellBoundary(file, readFileSync(path.join(ROOT, file), "utf8")))).toEqual([]);
  });

  it("gives Gate, CompanyPicker and Suspense fallback main landmarks", () => {
    const source = readFileSync("features/platform/workspace.tsx", "utf8");
    const tree = ts.createSourceFile("workspace.tsx", source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
    const landmarks: string[] = [];
    const visit = (node: ts.Node) => {
      if (ts.isJsxOpeningElement(node) && node.tagName.getText(tree) === "main") landmarks.push(node.getText(tree));
      ts.forEachChild(node, visit);
    };
    visit(tree);
    expect(landmarks).toHaveLength(3);
    for (const main of landmarks) expect(main).toContain('id="main"');
  });

  it("labels the console sidebar navigation landmark", () => {
    expect(readFileSync("components/layout/console-sidebar.tsx", "utf8")).toMatch(/<nav\s+aria-label="[^"]+"/);
  });
});

it.each([
  ["app/unassigned/page.tsx", ""],
  ["app/(storehouse)/page.tsx", ""],
  ["app/(console)/console/page.tsx", 'import { ConsoleShell } from "@/components/layout";'],
  ["features/console/view.tsx", 'import { ConsoleShell } from "@/components/layout/console-shell";'],
  ["app/(store)/layout.tsx", 'import Navbar from "@/components/navbar";'],
])("rejects AC-1 negative fixture: %s %s", (file, source) => {
  expect(violatesShellBoundary(file, source)).toBe(true);
});

it.each([
  "app/(store)/page.tsx", "app/(console)/console/page.tsx", "app/(auth)/login/page.tsx",
  "app/platform/staff/page.tsx", "app/company/settings/page.tsx",
])("accepts AC-1 shell-root fixture: %s", (file) => {
  expect(violatesShellBoundary(file, "")).toBe(false);
});

it.each([
  "app/layout.tsx", "app/(store)/layout.tsx", "app/not-found.tsx",
  "features/store/store-frame.tsx", "features/console/console-frame.tsx", "features/platform/workspace.tsx",
])("accepts AC-1 shell-import fixture: %s", (file) => {
  expect(violatesShellBoundary(file, 'import { StoreShell } from "@/components/layout";')).toBe(false);
});


it("rejects relative mock imports", () => {
  expect(hasMockImport('import { value } from "../../mocks/console";')).toBe(true);
});

it.each([
  '<Button onClick={() => save()} className="rounded-lg">Save</Button>',
  '<Button onClick={() => save()} className="bg-primary" />',
  '<Button className={"h-7 px-2.5"}>Save</Button>',
  "<Button className={'rounded-lg'} />",
  '<Button className={`bg-primary`} />',
  '<Button className="px-3" />',
  '<Button className="hover:text-rose-600" />',
  '<Button className={"dark:focus:text-emerald-500/80"} />',
  '<Button className={`focus-visible:border-amber-500`} />',
  '<Button className="group-hover:ring-sky-400" />',
  '<Button className="disabled:from-red-600" />',
  '<Button className="data-[state=open]:to-blue-500" />',
  '<Button className="md:dark:via-violet-500" />',
  '<Button className="hover:bg-orange-500" />',
])("rejects AC-6 Button override fixture: %s", (source) => {
  expect(hasButtonOverride(source)).toBe(true);
});

it.each([
  '<Button onClick={() => save()} variant="outline" size="sm" />',
  '<Button className={"gap-2 mx-auto"} />',
  '<Button className="w-full mt-2 gap-2" />',
  '<Button className="text-xs text-[var(--muted-foreground)] border-border ring-ring" />',
  '<Badge className="bg-primary rounded-lg h-7 px-3" />',
  `const text = '<Button className="rounded-lg" />';`,
])("accepts AC-6 fixture without Button overrides: %s", (source) => {
  expect(hasButtonOverride(source)).toBe(false);
});

it.each(["text", "bg", "border", "ring", "from", "to", "via"])(
  "rejects arbitrary hex Button color utility: %s", (utility) => {
    expect(hasButtonOverride(`<Button className="dark:hover:${utility}-[#aBc]" />`)).toBe(true);
    expect(hasButtonOverride(`<Button className="focus:${utility}-[#0284C7]/50" />`)).toBe(true);
    expect(hasButtonOverride(`<Button className="${utility}-[#abcd]" />`)).toBe(true);
    expect(hasButtonOverride(`<Button className="${utility}-[#0284C780]" />`)).toBe(true);
  }
);
