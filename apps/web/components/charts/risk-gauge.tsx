import { cn } from "@/lib/utils";

export function RiskGauge({ value, label }: { value: number; label: string }) {
  const percentage = Math.max(0, Math.min(100, Math.round(value * 100)));
  const color = percentage >= 70 ? "bg-danger" : percentage >= 40 ? "bg-warning" : "bg-success";

  return (
    <div className="rounded-xl border bg-card p-4">
      <p className="mb-2 text-xs text-muted-foreground">{label}</p>
      <div className="h-3 w-full overflow-hidden rounded-full bg-muted">
        <div className={cn("h-full transition-all", color)} style={{ width: `${percentage}%` }} />
      </div>
      <p className="mt-2 text-sm font-semibold">{percentage}%</p>
    </div>
  );
}
