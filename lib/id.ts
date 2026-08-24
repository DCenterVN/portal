export function newRequestId() {
  const now = Date.now().toString(16).padStart(12, "0");
  const random = crypto.getRandomValues(new Uint8Array(10));
  const hex = Array.from(random, (byte) => byte.toString(16).padStart(2, "0")).join("");
  return `${now.slice(0, 8)}-${now.slice(8, 12)}-7${hex.slice(0, 3)}-${hex.slice(3, 7)}-${hex.slice(7, 19)}`;
}
