import { Droplets, Gauge, ShieldAlert, Waves, WavesLadder } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatNumber } from "@/lib/format";

const items = [
  { key: "storage", label: "ذخیره مخزن", unit: "میلیون مترمکعب", icon: WavesLadder },
  { key: "level", label: "تراز آب", unit: "متر", icon: Gauge },
  { key: "inflow", label: "ورودی", unit: "مترمکعب/ثانیه", icon: Droplets },
  { key: "demandSatisfaction", label: "درصد تامین تقاضا", unit: "%", icon: Waves },
  { key: "envFlow", label: "دبی محیط‌زیستی", unit: "مترمکعب/ثانیه", icon: Waves },
  { key: "riskIndex", label: "شاخص ریسک", unit: "شاخص", icon: ShieldAlert }
] as const;

export function KpiCards({
  data
}: {
  data: Record<(typeof items)[number]["key"], number>;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {items.map((item) => {
        const Icon = item.icon;
        const value = data[item.key];
        return (
          <Card key={item.key}>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{item.label}</span>
                <Icon className="h-4 w-4" />
              </CardTitle>
            </CardHeader>
            <CardContent className="flex items-center justify-between">
              <p className="text-xl font-bold">{formatNumber(value, item.key === "riskIndex" ? 2 : 0)}</p>
              <Badge>{item.unit}</Badge>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
