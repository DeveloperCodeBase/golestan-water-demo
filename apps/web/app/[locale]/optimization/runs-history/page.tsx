"use client";

import { ModulePage } from "@/components/module-page";
import { RunsTable } from "@/components/charts/runs-table";
import { useApiQuery } from "@/lib/api-client";

export default function RunsHistoryPage({ params }: any) {
  const locale = params.locale === "en" ? "en" : "fa";
  const runs = useApiQuery<Array<any>>("/optimization/runs?page=1&page_size=30", []);

  const rows = runs.data.map((run) => ({
    id: run.id,
    scenario: run.params?.scenario ?? "normal",
    horizon: run.params?.horizon_days ?? 14,
    satisfaction: run.summary?.overall_satisfaction ?? 0.82,
    risk: (Number(run.summary?.flood_risk ?? 0.2) + Number(run.summary?.drought_risk ?? 0.2)) / 2,
    created_at: run.created_at
  }));

  return (
    <ModulePage
      locale={locale}
      title="بهینه‌سازی | تاریخچه اجراها"
      breadcrumbs={[{ label: "خانه", href: "/overview" }, { label: "بهینه‌سازی" }, { label: "تاریخچه اجرا" }]}
      loading={runs.loading}
      error={runs.error ? "خطا در دریافت اجراها" : null}
      empty={!runs.loading && rows.length === 0}
    >
      <RunsTable data={rows} />
    </ModulePage>
  );
}
