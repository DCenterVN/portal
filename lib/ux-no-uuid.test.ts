import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import ts from "typescript";
import { expect, it } from "vitest";

// Existing screens outside S2–S4 stay tracked until their D-246 slices land.
const allowlist: Record<string, { reason: string; debt: "D-246" }> = {
  "features/console/live-console.tsx": { reason: "Fallback user.id của console nằm ngoài S2–S4.", debt: "D-246" },
  "features/sales/pricing-floor-view.tsx": { reason: "S1 giá sàn chờ BE, brief cấm thực hiện trong S2–S4.", debt: "D-246" },
  "features/staff-profile/staff-profile-view.tsx": { reason: "Fallback org_id của hồ sơ nhân viên nằm ngoài plan.", debt: "D-246" },
};
const forbiddenField = /^(?:id|.*_id|.*_ref)$/;
const forbiddenLabel = /UUID|\bID\b|_ref/i;

function files(root: string): string[] {
  return readdirSync(root, { withFileTypes: true }).flatMap((entry) => {
    const file = path.join(root, entry.name);
    if (entry.isDirectory()) return files(file);
    return file.endsWith(".tsx") && !file.endsWith(".test.tsx") ? [file] : [];
  });
}

function exposesId(expression: ts.Expression): boolean {
  if (ts.isPropertyAccessExpression(expression)) return forbiddenField.test(expression.name.text);
  if (ts.isElementAccessExpression(expression) && expression.argumentExpression && ts.isStringLiteral(expression.argumentExpression)) return forbiddenField.test(expression.argumentExpression.text);
  if (ts.isParenthesizedExpression(expression)) return exposesId(expression.expression);
  if (ts.isConditionalExpression(expression)) return exposesId(expression.whenTrue) || exposesId(expression.whenFalse);
  if (ts.isBinaryExpression(expression)) {
    if (expression.operatorToken.kind === ts.SyntaxKind.AmpersandAmpersandToken) return exposesId(expression.right);
    if ([ts.SyntaxKind.QuestionQuestionToken, ts.SyntaxKind.BarBarToken].includes(expression.operatorToken.kind)) return exposesId(expression.left) || exposesId(expression.right);
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

function scan(file: string): string[] {
  const source = ts.createSourceFile(file, readFileSync(file, "utf8"), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const violations: string[] = [];
  const report = (node: ts.Node) => {
    const line = source.getLineAndCharacterOfPosition(node.getStart(source)).line + 1;
    violations.push(`${file}:${line}: ${node.getText(source)}`);
  };
  function visit(node: ts.Node) {
    if (ts.isJsxAttribute(node) && ["label", "placeholder", "title", "aria-label"].includes(node.name.getText(source))) {
      const value = node.initializer;
      if (value && forbiddenLabel.test(labelText(value))) report(node);
    }
    if (ts.isJsxElement(node) && node.openingElement.tagName.getText(source) === "label") {
      for (const child of node.children) if (ts.isJsxText(child) && forbiddenLabel.test(child.text)) report(child);
    }
    if (ts.isJsxExpression(node) && !ts.isJsxAttribute(node.parent) && node.expression && exposesId(node.expression)) report(node);
    ts.forEachChild(node, visit);
  }
  visit(source);
  return violations;
}

it("repo_scan_no_uuid", () => {
  const violations = [...files("features"), ...files("components")].flatMap((file) => {
    const found = scan(file);
    if (!allowlist[file]) return found;
    expect(allowlist[file].reason).toBeTruthy();
    expect(allowlist[file].debt).toBe("D-246");
    expect(found.length, `Remove stale allowlist entry: ${file}`).toBeGreaterThan(0);
    return [];
  });
  expect(violations).toEqual([]);
});
