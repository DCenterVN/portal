import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import ts from "typescript";
import { expect, it } from "vitest";

// Existing screens outside S2–S4 stay tracked until their D-246 slices land.
const allowlist: Record<string, { reason: string; debt: "D-246" }> = {
  "features/sales/pricing-floor-view.tsx": { reason: "S1 giá sàn chờ BE, brief cấm thực hiện trong S2–S4.", debt: "D-246" },
};
// contract_ref is a paper contract number; audit separately filters UUID values.
const forbiddenField = /^(?!contract_ref$)(?:id|.*_id|.*_ref)$/;
const forbiddenLabel = /UUID|\bID\b|_ref|[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-/i;

function files(root: string): string[] {
  return readdirSync(root, { withFileTypes: true }).flatMap((entry) => {
    const file = path.join(root, entry.name);
    if (entry.isDirectory()) return files(file);
    return file.endsWith(".tsx") && !file.endsWith(".test.tsx") ? [file] : [];
  });
}

function exposesId(expression: ts.Expression): boolean {
  if (ts.isCallExpression(expression) && ts.isPropertyAccessExpression(expression.expression) && expression.expression.name.text === "slice") {
    const receiver = expression.expression.expression;
    return exposesId(receiver) || (ts.isIdentifier(receiver) && /^(?:id|ref|.*(?:Id|Ref)|.*_id|.*_ref)$/.test(receiver.text));
  }
  if (ts.isPropertyAccessExpression(expression)) return forbiddenField.test(expression.name.text);
  if (ts.isElementAccessExpression(expression) && expression.argumentExpression && ts.isStringLiteral(expression.argumentExpression)) return forbiddenField.test(expression.argumentExpression.text);
  if (ts.isParenthesizedExpression(expression)) return exposesId(expression.expression);
  if (ts.isConditionalExpression(expression)) return exposesId(expression.whenTrue) || exposesId(expression.whenFalse);
  if (ts.isBinaryExpression(expression)) {
    if (expression.operatorToken.kind === ts.SyntaxKind.AmpersandAmpersandToken) return exposesId(expression.right);
    if ([ts.SyntaxKind.QuestionQuestionToken, ts.SyntaxKind.BarBarToken, ts.SyntaxKind.PlusToken].includes(expression.operatorToken.kind)) return exposesId(expression.left) || exposesId(expression.right);
  }
  if (ts.isTemplateExpression(expression)) return expression.templateSpans.some((span) => exposesId(span.expression));
  return false;
}

function labelText(node: ts.Node): string {
  if (ts.isStringLiteralLike(node)) return node.text;
  if (ts.isTemplateExpression(node)) return [node.head.text, ...node.templateSpans.map((span) => span.literal.text)].join(" ");
  if (ts.isJsxExpression(node) && node.expression) return labelText(node.expression);
  if (ts.isConditionalExpression(node)) return `${labelText(node.whenTrue)} ${labelText(node.whenFalse)}`;
  return "";
}

function idCarriers(source: ts.SourceFile): { values: Set<string>; lists: Set<string> } {
  const values = new Set<string>();
  const lists = new Set<string>();
  const mapsToId = (node: ts.Node): boolean => (ts.isCallExpression(node) && ts.isPropertyAccessExpression(node.expression) && node.expression.name.text === "map" && ts.isArrowFunction(node.arguments[0]) && ts.isExpression(node.arguments[0].body) && exposesId(node.arguments[0].body)) || ts.forEachChild(node, mapsToId) === true;
  (function visit(node: ts.Node) {
    if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name) && node.initializer) {
      if (exposesId(node.initializer)) values.add(node.name.text);
      if (mapsToId(node.initializer)) lists.add(node.name.text);
    }
    ts.forEachChild(node, visit);
  })(source);
  return { values, lists };
}

function printsCarrier(node: ts.Node, carriers: ReturnType<typeof idCarriers>): boolean {
  if (!ts.isIdentifier(node)) return false;
  if (carriers.values.has(node.text)) return true;
  for (let up = node.parent; up; up = up.parent) {
    if (!ts.isArrowFunction(up) || !up.parameters.some((parameter) => parameter.name.getText() === node.text)) continue;
    const call = up.parent;
    return ts.isCallExpression(call) && ts.isPropertyAccessExpression(call.expression) && call.expression.name.text === "map" && ts.isIdentifier(call.expression.expression) && carriers.lists.has(call.expression.expression.text);
  }
  return false;
}

function scan(file: string, text = readFileSync(file, "utf8")): string[] {
  const source = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const violations: string[] = [];
  const carriers = idCarriers(source);
  const report = (node: ts.Node) => {
    const line = source.getLineAndCharacterOfPosition(node.getStart(source)).line + 1;
    violations.push(`${file}:${line}: ${node.getText(source)}`);
  };
  function visit(node: ts.Node) {
    if (ts.isJsxAttribute(node) && (["label", "placeholder", "title", "description", "emptyText"].includes(node.name.getText(source)) || node.name.getText(source).startsWith("aria-"))) {
      const value = node.initializer;
      if (value && (forbiddenLabel.test(labelText(value)) || (ts.isJsxExpression(value) && value.expression && exposesId(value.expression)))) report(node);
    }
    if (ts.isJsxElement(node) && node.openingElement.tagName.getText(source) === "label") {
      for (const child of node.children) if (ts.isJsxText(child) && forbiddenLabel.test(child.text)) report(child);
    }
    if (ts.isJsxExpression(node) && !ts.isJsxAttribute(node.parent) && node.expression && (exposesId(node.expression) || printsCarrier(node.expression, carriers))) report(node);
    if (ts.isCallExpression(node) && (node.expression.getText(source) === "toast" || /^toast\.\w+$/.test(node.expression.getText(source)))) {
      for (const argument of node.arguments) if (forbiddenLabel.test(labelText(argument)) || exposesId(argument)) report(argument);
    }
    ts.forEachChild(node, visit);
  }
  visit(source);
  return violations;
}

it("repo_scan_no_uuid", () => {
  const violations = [...files("features"), ...files("components"), ...files("app")].flatMap((file) => {
    const found = scan(file);
    if (!allowlist[file]) return found;
    expect(allowlist[file].reason).toBeTruthy();
    expect(allowlist[file].debt).toBe("D-246");
    expect(found.length, `Remove stale allowlist entry: ${file}`).toBeGreaterThan(0);
    return [];
  });
  expect(violations).toEqual([]);
});

it("scanner_catches_id_assigned_to_variable_then_printed", () => {
  const leak = "const ids = rows.map(row => row.branch_id); const view = <select>{ids.map(value => <option key={value}>{value}</option>)}</select>;";
  const safe = "const ids = rows.map(row => row.branch_id); const view = <select>{rows.map(row => <option key={row.branch_id}>{row.branch_name}</option>)}</select>;";
  expect(scan("leak.tsx", leak)).toHaveLength(1);
  expect(scan("safe.tsx", safe)).toEqual([]);
});
