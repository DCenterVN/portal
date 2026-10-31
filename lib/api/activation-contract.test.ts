import { spawnSync } from "node:child_process";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
vi.mock("server-only", () => ({}));
import { POST } from "../../app/api/auth/activate/route";

// Resolve the operation's actual request $ref against the complete OpenAPI root.
// Report only validation keywords, never payloads or ValidationError messages.
const validator = `
import json, sys, yaml
from jsonschema import Draft202012Validator
with open("contracts/auth.public.yaml") as source:
    doc = yaml.safe_load(source)
assert doc["openapi"] == "3.1.0"
operation = doc["paths"]["/auth/activate"]["post"]
assert operation["operationId"] == "activate"
assert operation["requestBody"]["required"] is True
assert set(operation["responses"]) == {"200", "400", "503"}
schema = dict(doc)
schema.update(operation["requestBody"]["content"]["application/json"]["schema"])
Draft202012Validator.check_schema(schema)
check = Draft202012Validator(schema)
results = []
for payload in json.load(sys.stdin):
    password = payload.get("password") if isinstance(payload, dict) else None
    policy = isinstance(password, str) and len(password) >= 12 and len(password.encode("utf-8")) <= 256
    errors = sorted({error.validator for error in check.iter_errors(payload)})
    results.append({"schema": not errors, "policy": policy, "errors": errors})
print(json.dumps(results))
`;
function validate(payloads: unknown[]) {
  const result = spawnSync("python3", ["-c", validator], {
    input: JSON.stringify(payloads), encoding: "utf8",
  });
  expect(result.error, "Python contract validator must run").toBeUndefined();
  expect(result.status, result.stderr).toBe(0);
  return JSON.parse(result.stdout) as {schema: boolean; policy: boolean; errors: string[]}[];
}
const body = (password = "owner-password") => ({token: "contract-fixture", password});
const accepted = ["a".repeat(12), "a".repeat(256), "é".repeat(128), "😀".repeat(12), "  owner-password  ", "e\u0301".repeat(6)];
beforeEach(() => {
  vi.stubEnv("AUTH_SERVICE_URL", "http://auth.test");
  vi.stubEnv("PORTAL_CLIENT_IP_SOURCE", "trusted-kong");
});
afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); });

describe("activation OpenAPI contract oracle", () => {
  it("accepts valid code-point/byte boundaries and unmodified whitespace/Unicode", () => {
    expect(validate(accepted.map(password => body(password))))
      .toEqual(accepted.map(() => ({schema: true, policy: true, errors: []})));
  });
  it("kills missing, wrong-type, empty-token and extra-confirm payload mutants", () => {
    const mutants = [
      {token: "contract-fixture"}, {password: "owner-password"},
      {...body(), token: 1}, {...body(), password: 1},
      {...body(), token: ""}, {...body(), confirm: "owner-password"},
      body("a".repeat(11)), body("a".repeat(257)), body("😀".repeat(11)),
    ];
    expect(validate(mutants).every(result => !result.schema)).toBe(true);
  });
  it("distinguishes character-valid but UTF-8 oversized passwords", () => {
    expect(validate([body("é".repeat(129)), body("😀".repeat(65))]))
      .toEqual([{schema: true, policy: false, errors: []}, {schema: true, policy: false, errors: []}]);
  });
  it.each(accepted.map((password, index) => [index, password] as const))(
    "BFF forwards a schema-valid owner password unchanged (boundary %i)", async (_index, password) => {
      const outbound: unknown[] = [];
      const fetch = vi.fn(async (_url: unknown, init?: RequestInit) => {
        outbound.push(JSON.parse(String(init?.body)));
        return Response.json({code: 200, status: "success", message: "OK"});
      });
      vi.stubGlobal("fetch", fetch);
      const response = await POST(new NextRequest("http://localhost/api/auth/activate", {
        method: "POST", headers: {"Content-Type": "application/json", "Sec-Fetch-Site": "same-origin", "X-Real-IP": "192.0.2.1"},
        body: JSON.stringify(body(password)),
      }));
      expect(response.status, "valid token+password must reach auth, not be rejected by BFF").toBe(200);
      expect(fetch).toHaveBeenCalledTimes(1);
      expect(fetch.mock.calls[0][0]).toBe("http://auth.test/auth/activate");
      expect(fetch.mock.calls[0][1]).toMatchObject({method: "POST", cache: "no-store"});
      expect(outbound).toEqual([body(password)]);
      expect(validate(outbound)).toEqual([{schema: true, policy: true, errors: []}]);
      expect(response.headers.get("cache-control")).toBe("no-store");
      expect(response.headers.get("set-cookie")).toBeNull();
    },
  );
});
