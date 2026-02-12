"use client";

import { useMemo } from "react";

import { InflowChart } from "@/components/charts/inflow-chart";
import { KpiCards } from "@/components/kpi-cards";
import { MapPanel } from "@/components/map-panel";
import { ModulePage } from "@/components/module-page";
import { Panel } from "@/components/panel";
import { useApiQuery } from "@/lib/api-client";
import { lineSeriesMock } from "@/lib/demo-data";
import { formatDatePersian } from "@/lib/format";

export default function ReservoirGatesPage({ params }: any) {
  const locale = params.locale === "en" ? "en" : "fa";

  const inflow = useApiQuery<Array<any>>("/timeseries?metric=inflow&page=1&page_size=20", []);
  const outflow = useApiQuery<Array<any>>("/timeseries?metric=outflow&page=1&page_size=20", []);
  const storage = useApiQuery<Array<any>>("/timeseries?metric=storage&page=1&page_size=20", []);

  const series = useMemo(() => {
    if (!inflow.data.length || !outflow.data.length || !storage.data.length) return lineSeriesMock;
    const maxLen = Math.min(inflow.data.length, outflow.data.length, storage.data.length, 20);
    return Array.from({ length: maxLen }).map((_, idx) => {
      const i = maxLen - idx - 1;
      return {
        day: formatDatePersian(inflow.data[i].ts, { month: "short", day: "numeric" }),
        inflow: inflow.data[i].value,
        outflow: outflow.data[i].value,
        storage: storage.data[i].value
      };
    });
  }, [inflow.data, outflow.data, storage.data]);

  const last = series[series.length - 1] ?? lineSeriesMock[lineSeriesMock.length - 1];

  return (
    <ModulePage
      locale={locale}
      title="پایش زنده | مخزن و دریچه‌ها"
      breadcrumbs={[{ label: "خانه", href: "/overview" }, { label: "پایش زنده" }, { label: "مخزن و دریچه‌ها" }]}
      loading={inflow.loading || outflow.loading || storage.loading}
      error={inflow.error || outflow.error || storage.error ? "خطا در دریافت داده پایش" : null}
      empty={false}
    >
      <KpiCards
        data={{
          storage: last.storage,
          level: 95 + (last.storage / 1200) * 35,
          inflow: last.inflow,
          demandSatisfaction: 87,
          envFlow: 24,
          riskIndex: 0.29
        }}
      />

      <Panel title="روند لحظه‌ای عملکرد مخزن">
        <InflowChart data={series} />
      </Panel>

      <MapPanel />
    </ModulePage>
  );
}
