import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join, relative, resolve } from "node:path";

const root = resolve(".");
const SCAN = ["app", "components", "features", "hooks", "lib"];
const SKIP_DIRS = new Set(["node_modules", ".next", "mocks"]);
const REMOVED_UI = /^@\/components\/ui\/(state|segmented|text-input|entity-picker|console-motion)(\.module\.css)?$/;
const BASELINE = join(root, "scripts", "check-structure.baseline.txt");
const violations = [];

function scan(folder) {
  for (const entry of readdirSync(folder, { withFileTypes: true })) {
    if (SKIP_DIRS.has(entry.name)) continue;
    const file = join(folder, entry.name);
    if (entry.isDirectory()) { scan(file); continue; }
    if (!/\.tsx?$/.test(entry.name)) continue;
    check(relative(root, file).replaceAll("\\", "/"), readFileSync(file, "utf8"));
  }
}

function check(path, source) {
  const isTest = /\.(test|spec)\.tsx?$/.test(path);
  const report = (index, rule) => violations.push(`${path}:${source.slice(0, index).split("\n").length} ${rule}`);
  const barrelHome = path.startsWith("components/") || path.startsWith("features/");
  if (barrelHome && /(^|\/)index\.tsx?$/.test(path)) report(0, "barrel-index");
  if (isTest) return;
  if (!path.startsWith("components/ui/")) {
    for (const match of source.matchAll(/<(dialog|table|select)\b/g)) report(match.index, `native-${match[1]}-outside-ui`);
  }
  if (!path.startsWith("lib/")) {
    for (const match of source.matchAll(/\bfetch\s*\(/g)) report(match.index, "fetch-outside-lib");
  }
  if (path.startsWith("features/") && path.endsWith(".tsx") && /\buseRouter\b/.test(source)) {
    report(source.indexOf("useRouter"), "router-logic-in-tsx");
  }
  if (/^lib\/.*-data\.ts$/.test(path) && !/import\s*["']server-only["']/.test(source)) report(0, "loader-missing-server-only");
  for (const match of source.matchAll(/(?:\bfrom\s*|\bimport\s*)["']([^"']+)["']/g)) {
    if (REMOVED_UI.test(match[1])) report(match.index, "removed-ui-import");
  }
}

for (const dir of SCAN) scan(join(root, dir));

const tolerated = new Map();
if (existsSync(BASELINE)) {
  for (const line of readFileSync(BASELINE, "utf8").split("\n")) {
    if (line.trim()) tolerated.set(line, (tolerated.get(line) ?? 0) + 1);
  }
}
const fresh = [];
for (const violation of violations.sort()) {
  const key = violation.replace(/:\d+ /, " ");
  if (tolerated.get(key) > 0) tolerated.set(key, tolerated.get(key) - 1);
  else fresh.push(violation);
}
for (const [key, left] of tolerated) {
  for (let i = 0; i < left; i++) console.log(`FIXED ${key}  (delete this line from scripts/check-structure.baseline.txt)`);
}
fresh.forEach((violation) => console.log(`NEW   ${violation}`));
console.log(`Structure violations: ${violations.length}, baselined ${violations.length - fresh.length}, new ${fresh.length}`);
if (process.argv.includes("--strict") && fresh.length) process.exitCode = 1;
