"use client";

import { ModulePage } from "@/components/module-page";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RunsTable } from "@/components/charts/runs-table";
import { useApiQuery } from "@/lib/api-client";
import { formatDateTimePersian } from "@/lib/format";

export default function ForecastModelsPage({ params }: any) {
  const locale = params.locale === "en" ? "en" : "fa";
  const runs = useApiQuery<Array<any>>("/forecast/runs?page=1&page_size=20", []);

  const tableRows = runs.data.map((run) => ({
    id: run.id,
    scenario: run.scenario,
    horizon: 14,
    satisfaction: 1 - (run.metrics?.mape ?? 0.2) / 100,
    risk: (run.metrics?.rmse ?? 0.12) / 100,
    created_at: run.created_at
  }));

  return (
    <ModulePage
      locale={locale}
      title="مرکز پیش‌بینی | رجیستری مدل‌ها"
      breadcrumbs={[{ label: "خانه", href: "/overview" }, { label: "مرکز پیش‌بینی" }, { label: "مدل‌ها" }]}
      loading={runs.loading}
      error={runs.error ? "خطا در دریافت مدل‌ها" : null}
      empty={!runs.loading && runs.data.length === 0}
    >
      <Card>
        <CardHeader>
          <CardTitle>مدل فعال: demo_baseline_v1</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1 text-sm text-muted-foreground">
          <p>زمان آخرین آموزش: {runs.data[0]?.created_at ? formatDateTimePersian(runs.data[0].created_at) : "-"}</p>
          <p>پنجره داده: پنج سال داده روزانه مصنوعی</p>
          <p>شاخص‌های دقت: MAE / RMSE / MAPE</p>
        </CardContent>
      </Card>
      <div className="mt-4">
        <RunsTable data={tableRows} />
      </div>
    </ModulePage>
  );
}
