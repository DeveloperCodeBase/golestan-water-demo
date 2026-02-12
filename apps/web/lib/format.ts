export function formatNumber(value: number, digits = 0): string {
  return new Intl.NumberFormat("fa-IR", { maximumFractionDigits: digits }).format(value);
}

export function formatPercent(value: number): string {
  return `${Math.round(value * 100)}%`;
}

export function shortDate(iso: string): string {
  const date = new Date(iso);
  return new Intl.DateTimeFormat("fa-IR-u-ca-persian", { month: "short", day: "numeric" }).format(date);
}

export function formatDatePersian(
  value: string | Date,
  options: Intl.DateTimeFormatOptions = { year: "numeric", month: "2-digit", day: "2-digit" }
): string {
  const date = typeof value === "string" ? new Date(value) : value;
  return new Intl.DateTimeFormat("fa-IR-u-ca-persian", options).format(date);
}

export function formatDateTimePersian(value: string | Date): string {
  const date = typeof value === "string" ? new Date(value) : value;
  return new Intl.DateTimeFormat("fa-IR-u-ca-persian", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}
