"use client";

import { DemandStackChart } from "@/components/charts/demand-stack";
import { ModulePage } from "@/components/module-page";
import { Panel } from "@/components/panel";
import { useApiQuery } from "@/lib/api-client";
import { demandStackMock } from "@/lib/demo-data";

export default function ForecastDemandPage({ params }: any) {
  const locale = params.locale === "en" ? "en" : "fa";
  const runs = useApiQuery<Array<any>>("/forecast/runs?page=1&page_size=20", []);

  return (
    <ModulePage
      locale={locale}
      title="مرکز پیش‌بینی | تقاضای بخشی"
      breadcrumbs={[{ label: "خانه", href: "/overview" }, { label: "مرکز پیش‌بینی" }, { label: "تقاضای بخش‌ها" }]}
      loading={runs.loading}
      error={runs.error ? "خطا در دریافت داده" : null}
      empty={false}
    >
      <Panel title="پیش‌بینی تقاضای شرب، محیط‌زیست، صنعت و کشاورزی">
        <DemandStackChart data={demandStackMock} />
      </Panel>
    </ModulePage>
  );
}
