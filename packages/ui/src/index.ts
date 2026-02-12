export type KpiCardProps = {
  label: string;
  value: string | number;
  unit?: string;
};

export function formatKpiValue(value: number, digits = 0): string {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: digits }).format(value);
}
