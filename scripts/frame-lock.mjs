// FR-13 frame lock: sha256 of every frame file. `--write` refreshes frame.lock.json, otherwise check and exit 1 on drift.
import console from "node:console";
import { createHash } from "node:crypto";
import { globSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
export const LOCK = "frame.lock.json";
// Screen baselines (e2e/visual/baseline/screens/**) are not frame: U slices add them.
export const FRAME_GLOBS = [
  "app/globals.css",
  "app/tokens.generated.css",
  "app/layout.tsx",
  "components/ui/**",
  "components/layout/**",
  "components/patterns/**",
  "eslint.config.mjs",
  "app/*-gate.test.ts",
  "app/frame-lock.test.ts",
  "scripts/frame-lock.mjs",
  "playwright.config.ts",
  "e2e/visual/preview.spec.ts",
  "e2e/visual/baseline/tokens-*.png",
  "package.json",
  "package-lock.json",
];

const sha256 = (file) => createHash("sha256").update(readFileSync(path.join(ROOT, file))).digest("hex");

export function frameHashes() {
  const files = globSync(FRAME_GLOBS, { cwd: ROOT, withFileTypes: true })
    .filter((entry) => entry.isFile())
    .map((entry) => path.relative(ROOT, path.join(entry.parentPath, entry.name)).split(path.sep).join("/"))
    .sort();
  return Object.fromEntries(files.map((file) => [file, sha256(file)]));
}

export function readLock() {
  return JSON.parse(readFileSync(path.join(ROOT, LOCK), "utf8")).files;
}

/** Files whose hash differs from the lock: changed, added (not in lock) or removed (in lock only). */
export function drift(locked, current) {
  const names = new Set([...Object.keys(locked), ...Object.keys(current)]);
  return [...names].sort().flatMap((file) => {
    if (!(file in current)) return [`xoá: ${file}`];
    if (!(file in locked)) return [`thêm: ${file}`];
    return locked[file] === current[file] ? [] : [`đổi: ${file}`];
  });
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const current = frameHashes();
  if (process.argv.includes("--write")) {
    writeFileSync(path.join(ROOT, LOCK), `${JSON.stringify({ files: current }, null, 2)}\n`);
    console.log(`${LOCK}: ${Object.keys(current).length} file khung`);
  } else {
    const lines = drift(readLock(), current);
    if (lines.length) {
      console.error(`Khung lệch khỏi ${LOCK} (đổi khung phải qua slice khung của Claude):\n${lines.join("\n")}`);
      process.exit(1);
    }
    console.log(`${LOCK}: khớp ${Object.keys(current).length} file`);
  }
}
