export function isLocale(value: string): value is "fa" | "en" {
  return value === "fa" || value === "en";
}

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
