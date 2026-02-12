import { cn } from "@/lib/utils";

export function ReleaseHeatmap({ rows }: { rows: Array<{ ts: string; release_value: number }> }) {
  const max = Math.max(1, ...rows.map((r) => r.release_value));

  return (
    <div className="rounded-xl border bg-card p-4">
      <p className="mb-3 text-sm font-semibold">هیت‌مپ تقویم رهاسازی</p>
      <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
        {rows.slice(0, 35).map((row) => {
          const ratio = row.release_value / max;
          return (
            <div
              key={row.ts}
              title={`${row.ts}: ${row.release_value.toFixed(1)}`}
              className={cn(
                "h-8 rounded-sm sm:h-9",
                ratio > 0.75 ? "bg-cyan-600" : ratio > 0.5 ? "bg-cyan-400" : ratio > 0.25 ? "bg-cyan-300" : "bg-cyan-100"
              )}
            />
          );
        })}
      </div>
    </div>
  );
}
