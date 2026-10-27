import hashlib
import json
import re
import subprocess
from pathlib import Path

root = Path(__file__).parent
report = json.loads((root / "ux13-regression-report.json").read_text())
receipt = json.loads((root / "ux13-s9-regression.json").read_text())
check = next(c for c in receipt["checks"] if c["name"] == "e2e_regression")
assert hashlib.sha256(Path(check["log"]).read_bytes()).hexdigest() == check["sha256"]
assert check["exit"] == 1
assert not report.get("errors"), report.get("errors")
protected = ["e2e/catalog-split", "e2e/fooddev-set", "e2e/rbac", "e2e/fooddev-pack", "lib/api/auth-journey-bff.ts"]
diff = subprocess.check_output(["git", "diff", "306e8a9", "--stat", "--", *protected], text=True)
assert not diff.strip(), diff
rules = {
 "catalog-split/catalog-split.spec.ts": ("catalog-split.spec.ts:39:64", "permissionsOf", "401"),
 "fooddev-set/fooddev-set.spec.ts": ("fooddev-set.spec.ts:51:27", "warehouseGrants", "401"),
 "rbac/rbac.spec.ts": ("rbac.spec.ts:60:52", "grants", "401"),
 "fooddev-pack/fooddev-pack.spec.ts": ("fooddev-pack.spec.ts:81:40", "fooddev-pack.spec.ts:117:24", "Network.getResponseBody", "No resource with given identifier found"),
}
rows = []
passed_inventory = 0
counts = {"expected": 0, "skipped": 0, "unexpected": 0, "flaky": 0}
def visit(suite):
 global passed_inventory
 for child in suite.get("suites", []):
  visit(child)
 for spec in suite.get("specs", []):
  for test in spec["tests"]:
   counts[test["status"]] += 1
   assert test["projectName"] == "desktop"
   if spec["file"] == "inventory-ux/inventory-ux.spec.ts" and test["status"] == "expected":
    passed_inventory += 1
   if test["status"] != "unexpected":
    continue
   errors = "\n".join(e.get("message", "") + e.get("stack", "") for r in test["results"] for e in r.get("errors", []))
   errors = re.sub(r"\x1b\[[0-9;]*m", "", errors)
   rule = rules.get(spec["file"], ())
   known = bool(rule) and all(part in errors for part in rule)
   if spec["file"] != "fooddev-pack/fooddev-pack.spec.ts":
    known = known and "Expected: 200" in errors and "Received: 401" in errors
   rows.append({"file": spec["file"], "line": spec["line"], "title": spec["title"], "classification": "D-308" if known else "moi", "signature": list(rule)})
for suite in report["suites"]:
 visit(suite)
assert counts == {k: report["stats"][k] for k in counts}
assert passed_inventory == 3
assert counts["flaky"] == 0
assert rows and all(row["classification"] == "D-308" for row in rows), rows
for name, expected in [("ux13-s9-first.json", "7 passed"), ("ux13-s9-stable.json", "21 passed")]:
 data = json.loads((root / name).read_text())
 assert data["verdict"] == "PASS"
 c = data["checks"][0]
 content = Path(c["log"]).read_bytes()
 assert hashlib.sha256(content).hexdigest() == c["sha256"]
 assert expected in content.decode()
(root / "ux13-regression-classification.json").write_text(json.dumps({"counts": counts, "inventory_pass": passed_inventory, "protected_diff_lines": 0, "failures": rows}, ensure_ascii=False, indent=2) + "\n")
print(f"regress {counts['expected']}/{sum(counts.values())}; D-308 {len(rows)}; moi 0; inventory-ux 3/3; protected diff 0 lines; task 7/7 stable 21/21")
