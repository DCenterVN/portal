import {afterEach, describe, expect, it, vi} from "vitest";
vi.mock("server-only", () => ({}));
import {resolveClientIP, authHeaders} from "./client-ip";
afterEach(() => {vi.unstubAllEnvs(); vi.restoreAllMocks();});
describe("trusted ingress IP", () => {
  it.each([["192.0.2.1", "192.0.2.1"], ["2001:0DB8:0000:0000:0000:0000:0000:0001", "2001:db8::1"], ["::ffff:192.0.2.1", "192.0.2.1"], ["::FFFF:C000:0201", "192.0.2.1"]])("canonicalizes %s", (raw, expected) => {
    vi.stubEnv("PORTAL_CLIENT_IP_SOURCE", "trusted-kong");
    expect(resolveClientIP(new Headers({"X-Real-IP": raw}))).toBe(expected);
  });
  it.each([null, "", "192.0.2.1, 192.0.2.2", "192.0.2.1:80", "[::1]", "[::1]:80", "fe80::1%eth0", "not-an-ip", "192.000.2.1", "::1, ::1"])("rejects %s without fallback", raw => {
    vi.stubEnv("PORTAL_CLIENT_IP_SOURCE", "trusted-kong");
    const headers = new Headers({"X-Forwarded-For": "192.0.2.99", Forwarded: "for=192.0.2.99"});
    if (raw !== null) headers.set("X-Real-IP", raw);
    expect(() => resolveClientIP(headers)).toThrow(/X-Real-IP/);
  });
  it("rejects duplicate identical values", () => {
    vi.stubEnv("PORTAL_CLIENT_IP_SOURCE", "trusted-kong");
    const headers = new Headers([["X-Real-IP", "192.0.2.1"], ["X-Real-IP", "192.0.2.1"]]);
    expect(() => resolveClientIP(headers)).toThrow();
  });
  it("fails closed on unknown configuration", () => {
    vi.stubEnv("PORTAL_CLIENT_IP_SOURCE", "browser");
    expect(() => resolveClientIP(new Headers())).toThrow(/PORTAL_CLIENT_IP_SOURCE.*browser/);
  });
  it("unset mode sends no IP and warns once across repeated resolutions", () => {
    vi.stubEnv("PORTAL_CLIENT_IP_SOURCE", undefined);
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    expect(resolveClientIP(new Headers())).toBeUndefined();
    expect(resolveClientIP(new Headers({"X-Real-IP": "192.0.2.1"}))).toBeUndefined();
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn.mock.calls[0][0]).toContain("PORTAL_CLIENT_IP_SOURCE");
    expect(authHeaders(undefined, {"Content-Type": "application/json"})).toEqual({"Content-Type": "application/json"});
  });
  it("replaces forwarding claims while retaining only explicit auth headers", () => {
    expect(authHeaders("192.0.2.1", {"X-Forwarded-For": "evil", "x-real-ip": "evil", Forwarded: "evil", Host: "evil", Authorization: "Bearer token"})).toEqual({Authorization: "Bearer token", "X-Forwarded-For": "192.0.2.1"});
  });
});
