"use client";

import { useMemo, useState } from "react";

import { InflowChart } from "@/components/charts/inflow-chart";
import { ModulePage } from "@/components/module-page";
import { Panel } from "@/components/panel";
import { RunsTable } from "@/components/charts/runs-table";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { authedPost, useApiQuery, useApiToken } from "@/lib/api-client";
import { lineSeriesMock } from "@/lib/demo-data";

export default function ForecastInflowPage({ params }: any) {
  const locale = params.locale === "en" ? "en" : "fa";
  const { token } = useApiToken();
  const runs = useApiQuery<Array<any>>("/forecast/runs?page=1&page_size=20", []);
  const [scenario, setScenario] = useState("normal");
  const [message, setMessage] = useState<string | null>(null);

  const rows = useMemo(
    () =>
      runs.data.map((run) => ({
        id: run.id,
        scenario: run.scenario,
        horizon: 14,
        satisfaction: 1 - (run.metrics?.mape ?? 20) / 100,
        risk: (run.metrics?.rmse ?? 15) / 100,
        created_at: run.created_at
      })),
    [runs.data]
  );

  const runForecast = async () => {
    if (!token) return;
    try {
      await authedPost<any>("/forecast/run", token, {
        entity: "inflow",
        horizon_days: 14,
        scenario
      });
      setMessage("اجرای پیش‌بینی با موفقیت انجام شد. صفحه را بازخوانی کنید.");
    } catch {
      setMessage("اجرای پیش‌بینی ناموفق بود.");
    }
  };

  return (
    <ModulePage
      locale={locale}
      title="مرکز پیش‌بینی | ورودی رودخانه"
      breadcrumbs={[{ label: "خانه", href: "/overview" }, { label: "مرکز پیش‌بینی" }, { label: "ورودی" }]}
      loading={runs.loading}
      error={runs.error ? "خطا در دریافت پیش‌بینی" : null}
      empty={false}
    >
      <Panel title="پیش‌بینی ورودی با باند عدم قطعیت">
        <div className="mb-3 flex flex-wrap gap-2">
          <Select value={scenario} onChange={(e) => setScenario(e.target.value)} className="max-w-44">
            <option value="wet">تر</option>
            <option value="normal">نرمال</option>
            <option value="dry">خشک</option>
          </Select>
          <Button onClick={runForecast} disabled={!token}>اجرای پیش‌بینی</Button>
          {message ? <span className="text-xs text-muted-foreground">{message}</span> : null}
        </div>
        <InflowChart data={lineSeriesMock} />
      </Panel>

      <div className="mt-4">
        <Panel title="بک‌تست و شاخص‌های دقت (MAE/RMSE/MAPE)">
          <RunsTable data={rows} />
        </Panel>
      </div>
    </ModulePage>
  );
}
