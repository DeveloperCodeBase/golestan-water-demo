"use client";

import { useMemo } from "react";

import { BaselineCompare } from "@/components/baseline-compare";
import { ExplainPanel } from "@/components/explain-panel";
import { DemandStackChart } from "@/components/charts/demand-stack";
import { InflowChart } from "@/components/charts/inflow-chart";
import { RiskGauge } from "@/components/charts/risk-gauge";
import { RunsTable, type RunRow } from "@/components/charts/runs-table";
import { KpiCards } from "@/components/kpi-cards";
import { MapPanel } from "@/components/map-panel";
import { ModulePage } from "@/components/module-page";
import { NotificationCenter } from "@/components/notification-center";
import { Panel } from "@/components/panel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useApiQuery } from "@/lib/api-client";
import { demandStackMock, kpisMock, lineSeriesMock, runRowsMock } from "@/lib/demo-data";
import { formatDatePersian } from "@/lib/format";

export default function OverviewPage({ params }: any) {
  const locale = params.locale === "en" ? "en" : "fa";

  const runsQuery = useApiQuery<Array<any>>("/optimization/runs?page=1&page_size=12", []);
  const alertsQuery = useApiQuery<Array<any>>("/alerts?page=1&page_size=6", []);
  const inflowQuery = useApiQuery<Array<any>>("/timeseries?metric=inflow&page=1&page_size=14", []);
  const outflowQuery = useApiQuery<Array<any>>("/timeseries?metric=outflow&page=1&page_size=14", []);
  const storageQuery = useApiQuery<Array<any>>("/timeseries?metric=storage&page=1&page_size=14", []);

  const loading =
    runsQuery.loading || alertsQuery.loading || inflowQuery.loading || outflowQuery.loading || storageQuery.loading;

  const error = runsQuery.error || alertsQuery.error || inflowQuery.error || outflowQuery.error || storageQuery.error;

  const lineData = useMemo(() => {
    if (!inflowQuery.data.length || !outflowQuery.data.length || !storageQuery.data.length) {
      return lineSeriesMock;
    }
    const maxLen = Math.min(inflowQuery.data.length, outflowQuery.data.length, storageQuery.data.length, 14);
    return Array.from({ length: maxLen }).map((_, idx) => {
      const i = maxLen - idx - 1;
      const inflow = inflowQuery.data[i];
      const outflow = outflowQuery.data[i];
      const storage = storageQuery.data[i];
      return {
        day: formatDatePersian(inflow.ts, { month: "short", day: "numeric" }),
        inflow: inflow.value,
        outflow: outflow.value,
        storage: storage.value
      };
    });
  }, [inflowQuery.data, outflowQuery.data, storageQuery.data, locale]);

  const runRows: RunRow[] = useMemo(() => {
    if (!runsQuery.data.length) {
      return runRowsMock;
    }
    return runsQuery.data.map((run) => ({
      id: run.id,
      scenario: run.params?.scenario ?? "normal",
      horizon: run.params?.horizon_days ?? 14,
      satisfaction: run.summary?.overall_satisfaction ?? 0.8,
      risk: (Number(run.summary?.flood_risk ?? 0.2) + Number(run.summary?.drought_risk ?? 0.2)) / 2,
      created_at: run.created_at
    }));
  }, [runsQuery.data]);

  const latestRun = runsQuery.data[0];

  const kpis = useMemo(() => {
    if (!lineData.length || !latestRun) return kpisMock;
    const last = lineData[lineData.length - 1];
    return {
      storage: last.storage,
      level: 95 + (last.storage / 1200) * 35,
      inflow: last.inflow,
      demandSatisfaction: (latestRun.summary?.overall_satisfaction ?? 0.85) * 100,
      envFlow: latestRun.summary?.satisfaction_by_sector?.environment
        ? latestRun.summary.satisfaction_by_sector.environment * 25
        : 24,
      riskIndex: (Number(latestRun.summary?.flood_risk ?? 0.2) + Number(latestRun.summary?.drought_risk ?? 0.3)) / 2
    };
  }, [lineData, latestRun]);

  return (
    <ModulePage
      locale={locale}
      title="داشبورد مدیریتی سامانه"
      breadcrumbs={[{ label: "خانه", href: "/overview" }, { label: "نمای کلی" }]}
      loading={loading}
      error={error ? "خطا در واکشی داده از API" : null}
      empty={false}
    >
      <div className="space-y-4">
        <KpiCards data={kpis} />

        <div className="grid gap-4 xl:grid-cols-3">
          <Card className="xl:col-span-2">
            <CardHeader>
              <CardTitle>روند زمانی ورودی، خروجی و ذخیره</CardTitle>
            </CardHeader>
            <CardContent>
              <InflowChart data={lineData} />
            </CardContent>
          </Card>
          <div className="space-y-3">
            <RiskGauge value={latestRun?.summary?.drought_risk ?? 0.33} label="ریسک خشکسالی" />
            <RiskGauge value={latestRun?.summary?.flood_risk ?? 0.2} label="ریسک سیلاب" />
            <BaselineCompare
              smart={Number(latestRun?.summary?.overall_satisfaction ?? 0.84)}
              traditional={Number(latestRun?.summary?.baseline?.overall_satisfaction ?? 0.76)}
            />
          </div>
        </div>

        <div className="grid gap-4 xl:grid-cols-3">
          <Card className="xl:col-span-2">
            <CardHeader>
              <CardTitle>پیش‌بینی و تقاضای بخشی آب</CardTitle>
            </CardHeader>
            <CardContent>
              <DemandStackChart data={demandStackMock} />
            </CardContent>
          </Card>
          <NotificationCenter items={alertsQuery.data ?? []} />
        </div>

        <div className="grid gap-4 xl:grid-cols-3">
          <div className="xl:col-span-2">
            <Panel title="تاریخچه اجراهای بهینه‌سازی">
              <RunsTable data={runRows} />
            </Panel>
          </div>
          <ExplainPanel token={runsQuery.token} defaultRunId={latestRun?.id} />
        </div>

        <Panel title="شاخص‌های علمی بهره‌برداری (Demo قابل توسعه)">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-lg border p-3">
              <p className="text-xs text-muted-foreground">قابلیت اعتماد تامین</p>
              <p className="mt-1 text-xl font-black">{Math.round((latestRun?.summary?.overall_satisfaction ?? 0.86) * 100)}%</p>
            </div>
            <div className="rounded-lg border p-3">
              <p className="text-xs text-muted-foreground">تاب‌آوری در بازگشت به وضعیت ایمن</p>
              <p className="mt-1 text-xl font-black">{Math.round((1 - (latestRun?.summary?.flood_risk ?? 0.2)) * 100)}%</p>
            </div>
            <div className="rounded-lg border p-3">
              <p className="text-xs text-muted-foreground">آسیب‌پذیری کمبود آب</p>
              <p className="mt-1 text-xl font-black">{Math.round((latestRun?.summary?.drought_risk ?? 0.25) * 100)}%</p>
            </div>
            <div className="rounded-lg border p-3">
              <p className="text-xs text-muted-foreground">امتیاز انطباق با قیود ایمنی</p>
              <p className="mt-1 text-xl font-black">{Math.round((1 - (latestRun?.summary?.constraint_violations ?? 0)) * 100)}%</p>
            </div>
          </div>
        </Panel>

        <MapPanel />
      </div>
    </ModulePage>
  );
}
