const TIME_ZONE = "Asia/Ho_Chi_Minh";
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

const parts = new Intl.DateTimeFormat("en-GB", {
  timeZone: TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

function pick(value: string | number | Date) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return Object.fromEntries(parts.formatToParts(date).map(part => [part.type, part.value]));
}

export function formatDate(value: string | number | Date | null | undefined): string {
  if (value === null || value === undefined || value === "") return "";
  if (typeof value === "string" && ISO_DATE.test(value)) return value.split("-").reverse().join("/");
  const p = pick(value);
  return p ? `${p.day}/${p.month}/${p.year}` : "";
}

export function formatDateTime(value: string | number | Date | null | undefined): string {
  if (value === null || value === undefined || value === "") return "";
  const p = pick(value);
  return p ? `${p.day}/${p.month}/${p.year} ${p.hour}:${p.minute}` : "";
}

export function toISODate(value: string | number | Date = new Date()): string {
  const p = pick(value);
  return p ? `${p.year}-${p.month}-${p.day}` : "";
}
