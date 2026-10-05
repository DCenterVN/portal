import {isIP} from "node:net";

let warned = false;

export function resolveClientIP(headers: Headers): string | undefined {
  const mode = process.env.PORTAL_CLIENT_IP_SOURCE;
  if (mode === undefined) {
    if (!warned) {
      warned = true;
      console.warn("PORTAL_CLIENT_IP_SOURCE is unset; auth forwarding is disabled");
    }
    return undefined;
  }
  if (mode !== "trusted-kong") throw new Error(`Invalid PORTAL_CLIENT_IP_SOURCE: ${mode}`);
  const raw = headers.get("x-real-ip");
  if (!raw || raw.includes("%") || !isIP(raw)) throw new Error("Trusted Kong must supply exactly one literal X-Real-IP");
  if (isIP(raw) === 4) return raw;
  const canonical = new URL(`http://[${raw}]/`).hostname.slice(1, -1);
  const mapped = canonical.match(/^::ffff:([0-9a-f]+):([0-9a-f]+)$/);
  if (!mapped) return canonical;
  const high = parseInt(mapped[1], 16), low = parseInt(mapped[2], 16);
  return `${high >>> 8}.${high & 255}.${low >>> 8}.${low & 255}`;
}

// Callers supply their explicit allowlist, never the incoming request headers.
export function authHeaders(clientIP: string | undefined, explicit: Record<string, string>): Record<string, string> {
  const allowed = new Set(["content-type", "authorization", "cookie", "x-csrf-token", "user-agent"]);
  const headers = Object.fromEntries(Object.entries(explicit).filter(([name]) => allowed.has(name.toLowerCase())));
  if (clientIP !== undefined) headers["X-Forwarded-For"] = clientIP;
  return headers;
}
