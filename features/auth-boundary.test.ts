import { describe, expect, it } from "vitest";
import ts from "typescript";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

type Sources = Record<string, string>;
const customer = (p: string) => /features\/customer-auth\/|lib\/api\/customer-auth|components\/layout\/customer-auth-shell|app\/\(auth\)\/(login|register|activate|forgot-password|reset-password)|app\/api\/auth\/(login|register|activate|forgot|reset)\//.test(p);
const employee = (p: string) => /features\/employee-auth\/|lib\/api\/employee-auth|components\/layout\/employee-auth-shell|app\/\(employee-auth\)\/staff\/|app\/api\/auth\/staff\//.test(p);
function inspect(sources: Sources): string[] {
  const problems: string[] = [];
  const edges = new Map<string, string[]>();
  for (const [file, text] of Object.entries(sources)) {
    const imports: string[] = [];
    const ast = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
    const resolve = (name: string) => {
      const base = name.startsWith("@/") ? name.slice(2) : path.posix.normalize(path.posix.join(path.posix.dirname(file), name));
      return [base, `${base}.ts`, `${base}.tsx`, `${base}/index.ts`, `${base}/index.tsx`].find(p => p in sources);
    };
    const visit = (node: ts.Node) => {
      if ((ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) && node.moduleSpecifier && ts.isStringLiteral(node.moduleSpecifier)) {
        const name = node.moduleSpecifier.text;
        const base = name.startsWith("@/") ? name.slice(2) : path.posix.normalize(path.posix.join(path.posix.dirname(file), name));
        if (/^(features\/auth\/|components\/auth\/login-form|components\/layout\/auth-shell|app\/api\/auth\/switch-(org|branch)\/route)/.test(base)) problems.push(`${file}: import of retired auth ${base}`);
        const resolved = resolve(name); if (resolved) imports.push(resolved);
      }
      if (ts.isCallExpression(node) && node.expression.kind === ts.SyntaxKind.ImportKeyword) {
        const arg = node.arguments[0];
        if (!arg || !ts.isStringLiteral(arg)) { if (customer(file) || employee(file)) problems.push(`${file}: unresolved dynamic import`); }
        else { const resolved = resolve(arg.text); if (resolved) imports.push(resolved); else if (customer(file) || employee(file)) problems.push(`${file}: unresolved dynamic import ${arg.text}`); }
      }
      if ((customer(file) || employee(file)) && (ts.isConditionalExpression(node) || ts.isIfStatement(node))) {
        if (/customer|employee/.test(node.getText(ast))) problems.push(`${file}: runtime journey selection`);
      }
      if ((customer(file) || employee(file)) && ts.isJsxAttribute(node) && /^(mode|journey|accountType)$/.test(node.name.getText(ast))) problems.push(`${file}: generic journey prop`);
      ts.forEachChild(node, visit);
    };
    visit(ast); edges.set(file, imports);
    if (/features\/auth\/|components\/auth\/login-form|components\/layout\/auth-shell/.test(file)) problems.push(`${file}: legacy shared auth`);
    if ((customer(file) || employee(file)) && /Một tài khoản cho khách mua hàng và nhân viên|Dùng cho cả khách hàng và nhân viên/.test(text)) problems.push(`${file}: shared journey copy`);
  }
  for (const file of Object.keys(sources)) {
    if (!customer(file) && !employee(file)) continue;
    const seen = new Set<string>();
    const walk = (target: string, chain: string[]) => {
      if (seen.has(target)) return; seen.add(target);
      if ((customer(file) && employee(target)) || (employee(file) && customer(target))) problems.push(`${chain.join(" -> ")}: cross journey`);
      for (const next of edges.get(target) ?? []) walk(next, [...chain, next]);
    };
    walk(file, [file]);
  }
  return problems;
}
function liveSources(): Sources {
  const result: Sources = {};
  // Enumerate the approved file list, then read only its local import closure: no repository scan.
  const plan = readFileSync(".aidlc/runs/PORTAL-AUTH-SPLIT-001/plan.md", "utf8").split("## Files planned")[1].split("## Tests planned")[0];
  const load = (file: string) => {
    if (file in result || !existsSync(file) || /\.test\./.test(file) || !/\.tsx?$/.test(file)) return;
    const text = readFileSync(file, "utf8"); result[file] = text;
    const ast = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
    const dependency = (name: string) => {
      if (!name.startsWith("@/") && !name.startsWith(".")) return;
      const base = name.startsWith("@/") ? name.slice(2) : path.posix.normalize(path.posix.join(path.posix.dirname(file), name));
      const resolved = [base, `${base}.ts`, `${base}.tsx`, `${base}/index.ts`, `${base}/index.tsx`].find(candidate => existsSync(candidate) && /\.tsx?$/.test(candidate));
      if (resolved) load(resolved);
    };
    const visit = (node: ts.Node) => {
      if ((ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) && node.moduleSpecifier && ts.isStringLiteral(node.moduleSpecifier)) dependency(node.moduleSpecifier.text);
      if (ts.isCallExpression(node) && node.expression.kind === ts.SyntaxKind.ImportKeyword && node.arguments[0] && ts.isStringLiteral(node.arguments[0])) dependency(node.arguments[0].text);
      ts.forEachChild(node, visit);
    };
    visit(ast);
  };
  for (const match of plan.matchAll(/^- (.+\.tsx?)$/gm)) load(match[1]);
  return result;
}

describe("auth isolation AST oracle", () => {
  it("S17 retires the shared login and context resolver", () => {
    const files = ["home-for.ts", "home-for.test.ts", "login-form.tsx", "switch-branch-page.tsx"].map(name => `features/auth/${name}`);
    expect(files.filter(existsSync), "legacy login/context files must be removed").toEqual([]);
  });
  it("S16 retires legacy customer forms and feedback", () => {
    const files = ["activate-view", "forgot-form", "form-alert", "register-form", "reset-form"].map(name => `features/auth/${name}.tsx`);
    expect(files.filter(existsSync), "legacy customer files must be removed").toEqual([]);
  });
  it.each(["alias", "barrel", "index-barrel", "transitive-dynamic", "dynamic", "reverse", "both", "mode", "prop", "copy", "unresolved", "deleted-import", "deleted-relative"])("detects %s mutation", kind => {
    const c = "features/customer-auth/login-form.tsx", e = "features/employee-auth/login-form.tsx";
    const sources: Sources = { [c]: "export const Customer = 1", [e]: "export const Employee = 1" };
    if (kind === "deleted-import") sources[c] = 'import { Login } from "@/features/auth/login-form"';
    if (kind === "deleted-relative") sources[c] = 'import { Login } from "../auth/login-form"';
    if (kind === "alias") sources[c] = 'import { Employee } from "@/features/employee-auth/login-form"';
    if (kind === "barrel") { sources[c] = 'import { Employee } from "../../bridge"'; sources["bridge.ts"] = 'export * from "@/features/employee-auth/login-form"'; }
    if (kind === "index-barrel") { sources[c] = 'import { Employee } from "../../bridge"'; sources["bridge/index.ts"] = 'export * from "@/features/employee-auth/login-form"'; }
    if (kind === "transitive-dynamic") { sources[c] = 'import("../../bridge")'; sources["bridge.ts"] = 'export * from "@/features/employee-auth/login-form"'; }
    if (kind === "copy") sources["app/(auth)/login/page.tsx"] = 'export const Page = () => <p>Một tài khoản cho khách mua hàng và nhân viên chi nhánh.</p>';
    if (kind === "prop") sources[c] = 'export const Form = () => <Login mode="employee"/>';
    if (kind === "dynamic") sources[c] = 'import("@/features/employee-auth/login-form")';
    if (kind === "reverse") sources[e] = 'import("@/features/customer-auth/login-form")';
    if (kind === "both") sources["app/(auth)/login/page.tsx"] = 'import { Customer } from "@/features/customer-auth/login-form"; import { Employee } from "@/features/employee-auth/login-form"; export const Page = () => <><Customer/><Employee/></>';
    if (kind === "mode") sources[c] = 'export const Form = ({mode}) => mode === "customer" ? <Customer/> : <Employee/>';
    if (kind === "unresolved") sources[c] = 'import(target)';
    expect(inspect(sources)).not.toEqual([]);
  });
  it("allows independent modules and shared primitives", () => {
    expect(inspect({"features/customer-auth/login-form.tsx": 'import { Input } from "@/components/ui/input"', "features/employee-auth/login-form.tsx": 'import { Input } from "@/components/ui/input"', "components/ui/input.tsx": "export const Input = 1"})).toEqual([]);
  });
  it("S1 live gate: no legacy, cross imports, shared screens or missing ownership", () => {
    const sources = liveSources(); const problems = inspect(sources);
    for (const plane of ["customer", "employee"]) for (const file of [`features/${plane}-auth/${plane === "employee" ? "staff-login" : "login-form"}.tsx`, `components/layout/${plane}-auth-shell.tsx`, `lib/api/${plane}-auth.ts`]) if (!(file in sources)) problems.push(`${file}: missing journey owner`);
    const routes = ["login", "register", "activate", "forgot-password", "reset-password"].map(r => `app/(auth)/${r}/page.tsx`).concat(["login", "forgot-password", "reset-password", "invite/accept", "switch-branch", "switch-org"].map(r => `app/(employee-auth)/staff/${r}/page.tsx`));
    for (const file of routes) { if (!(file in sources)) problems.push(`${file}: missing journey route`); else {
        const plane = file.includes("/staff/") ? "employee" : "customer";
        const ast = ts.createSourceFile(file, sources[file], ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
        const owned = ast.statements.some(node => ts.isImportDeclaration(node) && ts.isStringLiteral(node.moduleSpecifier) && node.moduleSpecifier.text.includes(`/features/${plane}-auth/`));
        if (!owned) problems.push(`${file}: wrong journey owner`);
      } }
    expect(problems, problems.join("\n")).toEqual([]);
  });
});


describe("S19 independent auth translation catalogs", () => {
  it.each(["vi","en"])("%s supplies both journeys with distinct login and recovery copy", locale => {
    const messages=JSON.parse(readFileSync(`messages/${locale}.json`, "utf8"));
    for(const plane of ["customerAuth","employeeAuth"]) {
      for(const key of ["login","identifier","password","forgot","reset","loginPending","invalidCredentials","passwordPolicy","recoveryNotice","loginTitle","loginSubtitle","skipContent"]) expect(messages[plane]?.[key], `${locale}.${plane}.${key}`).toEqual(expect.any(String));
    }
    expect(messages.customerAuth.login).not.toBe(messages.employeeAuth.login);
    expect(messages.employeeAuth.recoveryNotice).not.toBe(messages.customerAuth.recoveryNotice);
    expect(messages.employeeAuth).not.toHaveProperty("register");
  });
  it("English auth catalog renders translated login without fallback", async () => {
    const {createTranslator}=await import("next-intl");
    const messages=JSON.parse(readFileSync("messages/en.json", "utf8"));
    const t=createTranslator({locale:"en", messages, namespace:"employeeAuth"});
    expect(t("login")).toBe("Staff sign in");
    expect(t("recoveryNotice")).toContain("administrator");
  });
});

 it("S19 journey UI consumes only its own namespace without hardcoded JSX copy", () => {
  for (const [file, source] of Object.entries(liveSources())) {
   if (!/^(features\/(customer|employee)-auth\/|components\/layout\/(customer|employee)-auth-shell|app\/\((auth|employee-auth)\)\/)/.test(file) || /form-feedback|layout\.tsx$/.test(file) || (!customer(file) && !employee(file))) continue;
   const namespace = employee(file) ? "employeeAuth" : "customerAuth";
   expect(source, file).toMatch(new RegExp(`(?:useTranslations|getTranslations)\\(["']${namespace}["'](?:\\)|,)`));
   const ast = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
   const raw: string[] = [];
   const visit = (node: ts.Node) => {
    if (ts.isJsxText(node) && node.text.trim()) raw.push(node.text.trim());
    if (ts.isJsxAttribute(node) && /^(title|subtitle|aria-label)$/.test(node.name.getText(ast)) && node.initializer && ts.isStringLiteral(node.initializer)) raw.push(node.initializer.text);
    ts.forEachChild(node, visit);
   };
   visit(ast); expect(raw, file).toEqual([]);
   expect(source).not.toContain(namespace === "customerAuth" ? '"employeeAuth"' : '"customerAuth"');
  }
 });
